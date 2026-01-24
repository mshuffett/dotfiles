---
name: aws
description: Use when working with AWS CLI, credentials, S3, EC2, Lambda, or other AWS services. Contains account config and IAM guidance.
---

# AWS Credentials & IAM

Michael's AWS account configuration and credential management.

## Account Details

- **Account ID**: 639237226972
- **Region**: us-east-1
- **Console URL**: https://639237226972.signin.aws.amazon.com/console

## IAM User (michael)

- **Username**: michael
- **Group**: Admins (`AdministratorAccess` policy)
- **MFA**: Enabled (TOTP in 1Password item "AWS IAM - michael (639237226972)")

## Credentials

### CLI Credentials

Stored in `~/.env.zsh` (sourced by zshrc):

```bash
export AWS_ACCESS_KEY_ID="<from 1Password>"
export AWS_SECRET_ACCESS_KEY="<from 1Password>"
export AWS_REGION="us-east-1"
```

Reload with: `source ~/.env.zsh`

### MFA for CLI Operations

Some operations require MFA. To get a session token:

```bash
# Get TOTP from 1Password
MFA_CODE=$(op item get "AWS IAM - michael (639237226972)" --otp)

# Get session token
aws sts get-session-token \
  --serial-number arn:aws:iam::639237226972:mfa/michael-mfa \
  --token-code "$MFA_CODE"
```

## Root Key Policy

**Never use root keys for daily operations.** Root-only operations:
- Closing the AWS account
- Changing account email/name
- Modifying root credentials
- Enabling MFA Delete on S3 buckets

## Secrets Management

| Secret Type | Primary Location | Backup Location |
|-------------|------------------|-----------------|
| AWS CLI keys | `~/.env.zsh` | 1Password |
| AWS console password | 1Password | - |
| MFA TOTP seed | 1Password | - |

### Adding New Secrets

1. Add to `~/.env.zsh` with descriptive comment
2. Update 1Password backup: `op item edit "env.zsh secrets backup" "notesPlain=$(cat ~/.env.zsh)"`

## Common Operations

```bash
# Verify credentials
aws sts get-caller-identity
# Expected: arn:aws:iam::639237226972:user/michael

# List resources
aws s3 ls                      # S3 buckets
aws ec2 describe-instances     # EC2 instances
aws lambda list-functions      # Lambda functions
```

## IAM Structure

```
Account 639237226972
└── Groups
    └── Admins (AdministratorAccess policy)
        └── Users
            └── michael (MFA enabled)
```
