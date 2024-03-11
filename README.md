# bedrock-chatbot

A chatbot using Amazon Bedrock's foundation models

## Recommended Environments

1. Sign in to your dev account and run the following statement to bootstrap the environment (Account/Region):

```bash
npx cdk bootstrap aws://DEV-ACCOUNT-NUMBER/REGION \
    --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
    --trust PIPELINE-ACCOUNT-ID
```
