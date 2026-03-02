import { Stack, StackProps } from "aws-cdk-lib";
import { UserPool, UserPoolClient, UserPoolDomain } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export type AuthStackProps = StackProps & {
  domainPrefix: string;
};

export class AuthStack extends Stack {
  readonly userPool: UserPool;
  readonly userPoolClient: UserPoolClient;
  readonly domain: UserPoolDomain;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    this.userPool = new UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      signInAliases: {
        email: true
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false
        }
      }
    });

    this.userPoolClient = this.userPool.addClient("WebClient", {
      authFlows: {
        userPassword: false,
        userSrp: false
      },
      oAuth: {
        callbackUrls: ["http://localhost:5173/auth/callback"],
        logoutUrls: ["http://localhost:5173/"]
      }
    });

    this.domain = this.userPool.addDomain("HostedDomain", {
      cognitoDomain: {
        domainPrefix: props.domainPrefix
      }
    });
  }
}
