import { Stack, StackProps } from "aws-cdk-lib";
import { Alarm, ComparisonOperator } from "aws-cdk-lib/aws-cloudwatch";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export class ObservabilityStack extends Stack {
  readonly apiLogGroup: LogGroup;
  readonly workerLogGroup: LogGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.apiLogGroup = new LogGroup(this, "ApiLogGroup", {
      retention: RetentionDays.ONE_MONTH
    });

    this.workerLogGroup = new LogGroup(this, "WorkerLogGroup", {
      retention: RetentionDays.ONE_MONTH
    });

    new Alarm(this, "ApiErrorAlarm", {
      metric: this.apiLogGroup.metricIncomingLogEvents(),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
    });
  }
}
