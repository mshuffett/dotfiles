export AWS_CREDENTIALS_ODIN="com.amazon.access.FMA EC2 Account-fma-science-1"
export AWS_DEFAULT_REGION=us-east-1
source /apollo/env/AmazonAwsCli/bin/aws_zsh_completer.sh
typeset -U path
path=(/apollo/env/AmazonAwsCli/bin "$path[@]")
