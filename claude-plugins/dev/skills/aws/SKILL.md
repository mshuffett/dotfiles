---
name: AWS IAM Setup
description: This skill should be used when working with AWS CLI, AWS services, AWS credentials, or when the user mentions "aws", "s3", "ec2", "lambda", or other AWS services. Contains account configuration and credential management guidance.
---

# AWS IAM Setup

Michael's AWS account configuration and credential management.

## Account Details

- **Account ID**: 639237226972
- **Region**: us-east-1
- **Console URL**: https://639237226972.signin.aws.amazon.com/console

## IAM User (michael)

The primary IAM user for all AWS operations:

- **Username**: michael
- **Group**: Admins (has `AdministratorAccess` policy)
- **MFA**: Enabled (TOTP stored in 1Password)
- **1Password Item**: "AWS IAM - michael (639237226972)"

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

**Never use root keys for daily operations.** Root access keys have been exposed and should be:
1. Rotated or deleted after IAM user setup is verified
2. Only used for account-level operations that IAM admins cannot perform

Root-only operations include:
- Closing the AWS account
- Changing account email/name
- Modifying root credentials
- Enabling MFA Delete on S3 buckets

## Secrets Management

### Storage Locations

| Secret Type | Primary Location | Backup Location |
|-------------|------------------|-----------------|
| AWS CLI keys | `~/.env.zsh` | 1Password |
| AWS console password | 1Password | - |
| MFA TOTP seed | 1Password | - |
| All secrets | `~/.env.zsh` | 1Password "env.zsh secrets backup" |

### Adding New Secrets

1. Add to `~/.env.zsh` with descriptive comment
2. Update 1Password backup: `op item edit "env.zsh secrets backup" "notesPlain=$(cat ~/.env.zsh)"`

## Common Operations

### Verify Credentials

```bash
aws sts get-caller-identity
```

Expected output shows `arn:aws:iam::639237226972:user/michael`

### List Resources

```bash
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
