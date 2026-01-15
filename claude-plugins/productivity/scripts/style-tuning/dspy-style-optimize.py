#!/usr/bin/env python3
"""
DSPy optimization for Michael's WhatsApp reply style.
Uses MIPROv2 to optimize the prompt based on training examples.
"""

import json
import os
import dspy
from dspy.evaluate import Evaluate
from dspy.teleprompt import MIPROv2

# Load training data
with open("prompts/training-data.json") as f:
    raw_data = json.load(f)

# Convert to DSPy examples
# Use conversation_history as context, input_message as input, output_reply as expected
examples = []
for item in raw_data:
    if len(item.get("output_reply", "")) > 0 and len(item.get("input_message", "")) > 0:
        # Format conversation history
        history = ""
        for msg in item.get("conversation_history", [])[-5:]:  # Last 5 messages
            who = "Michael" if msg["from"] == "me" else "Them"
            history += f"{who}: {msg['text']}\n"

        examples.append(dspy.Example(
            chat_name=item.get("chat_name", "Unknown"),
            conversation_history=history.strip(),
            input_message=item["input_message"],
            output_reply=item["output_reply"]
        ).with_inputs("chat_name", "conversation_history", "input_message"))

print(f"Loaded {len(examples)} examples")

# Split into train and test
train_examples = examples[:60]
test_examples = examples[60:]
print(f"Train: {len(train_examples)}, Test: {len(test_examples)}")


class MichaelStyleReply(dspy.Signature):
    """Generate 3 diverse WhatsApp reply options in Michael's style.

    CRITICAL: Each option must represent a DIFFERENT response type:
    - option_a: Affirmative/Yes/Accept response
    - option_b: Negative/Decline/Alternative response
    - option_c: Need more info/Clarification/Question response

    Style rules:
    - Extremely terse: 1-5 words typical
    - Phrases: 'K', 'Yeah', 'I'm down', 'lmk', 'does that work?'
    - Scheduling: send cal.com/everythingai/15min (short) or /30min (long)
    - No emojis, no formal greetings
    - Lowercase OK, ellipsis OK

    Examples:
    - "Is this your iMessage?" → A) Yeah  B) Nope different number  C) Which number did you try?
    - "Can we push our call to tomorrow?" → A) Works for me  B) Tomorrow's packed, what about Friday?  C) What time?
    - "Want to grab dinner Thursday?" → A) I'm down  B) Can't do Thursday  C) Where were you thinking?
    - "Can you intro me to [person]?" → A) Yeah happy to  B) Don't know them well enough tbh  C) What's the context?
    - "Just intro'd you to Dave" → A) awesome thanks  B) (no decline needed)  C) What's the context?"""

    chat_name: str = dspy.InputField(desc="Name of the chat/person")
    conversation_history: str = dspy.InputField(desc="Recent messages in the conversation")
    input_message: str = dspy.InputField(desc="The message to reply to")
    option_a: str = dspy.OutputField(desc="Affirmative/Yes reply (1-5 words)")
    option_b: str = dspy.OutputField(desc="Decline/Alternative reply (1-5 words)")
    option_c: str = dspy.OutputField(desc="Clarification/Question reply (1-5 words)")


class StyleMatcher(dspy.Module):
    def __init__(self):
        self.generate = dspy.Predict(MichaelStyleReply)

    def forward(self, chat_name, conversation_history, input_message):
        result = self.generate(
            chat_name=chat_name,
            conversation_history=conversation_history,
            input_message=input_message
        )
        # For backward compatibility, also set output_reply to option_a
        result.output_reply = result.option_a
        return result


class StyleJudge(dspy.Signature):
    """Judge if Michael's actual reply matches ANY of the 3 generated options."""

    input_message: str = dspy.InputField(desc="The message being replied to")
    actual_reply: str = dspy.InputField(desc="Michael's actual reply")
    option_a: str = dspy.InputField(desc="Generated option A (affirmative)")
    option_b: str = dspy.InputField(desc="Generated option B (decline/alternative)")
    option_c: str = dspy.InputField(desc="Generated option C (clarification)")

    best_match: str = dspy.OutputField(desc="Which option best matches actual: 'A', 'B', 'C', or 'none'")
    reasoning: str = dspy.OutputField(desc="Brief reasoning about which option matches")
    score: int = dspy.OutputField(desc="Score 0-100: how well does the best matching option capture the actual reply's intent?")


# Cache the judge to avoid recreating it
_judge = None

def get_judge():
    global _judge
    if _judge is None:
        _judge = dspy.ChainOfThought(StyleJudge)
    return _judge


def style_metric(example, pred, trace=None):
    """Fair metric: Check if actual reply matches ANY of the 3 generated options."""
    actual = example.output_reply.strip()

    # Get all 3 options
    options = [
        getattr(pred, 'option_a', '').strip(),
        getattr(pred, 'option_b', '').strip(),
        getattr(pred, 'option_c', '').strip(),
    ]

    # Check for exact match to any option
    for opt in options:
        if actual.lower() == opt.lower():
            return 1.0

    # Check for very similar match (same first word, similar length)
    for opt in options:
        if opt and actual.lower().split()[0:1] == opt.lower().split()[0:1] and abs(len(actual) - len(opt)) < 5:
            return 0.85

    # Use LLM judge for semantic matching
    try:
        judge = get_judge()
        result = judge(
            input_message=example.input_message,
            actual_reply=actual,
            option_a=options[0],
            option_b=options[1],
            option_c=options[2],
        )
        score = int(result.score) / 100.0
        return max(0.0, min(1.0, score))
    except Exception as e:
        # Fallback: check if actual is semantically similar to any option
        for opt in options:
            if opt:
                # Simple word overlap
                actual_words = set(actual.lower().split())
                opt_words = set(opt.lower().split())
                if actual_words & opt_words:
                    return 0.5
        return 0.0


def main():
    # Configure DSPy with Claude
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set")
        return

    lm = dspy.LM("anthropic/claude-sonnet-4-5-20250929", api_key=api_key)
    dspy.configure(lm=lm)

    # Create baseline model
    baseline = StyleMatcher()

    # Evaluate baseline
    print("\n=== Baseline Evaluation ===")
    evaluator = Evaluate(devset=test_examples[:10], metric=style_metric, num_threads=4)
    baseline_score = evaluator(baseline)
    print(f"Baseline score: {baseline_score}")

    # Show some baseline predictions
    print("\n=== Sample Baseline Predictions ===")
    for ex in test_examples[:3]:
        pred = baseline(
            chat_name=ex.chat_name,
            conversation_history=ex.conversation_history,
            input_message=ex.input_message
        )
        print(f"Input: {ex.input_message[:50]}...")
        print(f"Actual: {ex.output_reply}")
        print(f"Options: A) {pred.option_a} | B) {pred.option_b} | C) {pred.option_c}")
        print()

    # Optimize with MIPROv2
    print("\n=== Running MIPROv2 Optimization ===")
    optimizer = MIPROv2(
        metric=style_metric,
        num_candidates=3,
        init_temperature=0.7,  # Anthropic max is 1.0
        verbose=True,
    )

    optimized = optimizer.compile(
        baseline,
        trainset=train_examples[:40],
        max_bootstrapped_demos=2,
        max_labeled_demos=2,
        num_trials=10,
        minibatch_size=8,
        requires_permission_to_run=False,
    )

    # Evaluate optimized model
    print("\n=== Optimized Evaluation ===")
    optimized_score = evaluator(optimized)
    print(f"Optimized score: {optimized_score}")

    # Show optimized predictions
    print("\n=== Sample Optimized Predictions ===")
    for ex in test_examples[:3]:
        pred = optimized(
            chat_name=ex.chat_name,
            conversation_history=ex.conversation_history,
            input_message=ex.input_message
        )
        print(f"Input: {ex.input_message[:50]}...")
        print(f"Actual: {ex.output_reply}")
        print(f"Options: A) {pred.option_a} | B) {pred.option_b} | C) {pred.option_c}")
        print()

    # Print the optimized prompt
    print("\n=== Optimized Prompt ===")
    print(optimized.generate.signature)

    print(f"\n=== Summary ===")
    print(f"Baseline: {baseline_score}")
    print(f"Optimized: {optimized_score}")
    print(f"Improvement: {optimized_score - baseline_score:.2%}")


if __name__ == "__main__":
    main()
