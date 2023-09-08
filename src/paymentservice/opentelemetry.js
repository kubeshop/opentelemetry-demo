// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

// Auto Start
const opentelemetry = require("@opentelemetry/sdk-node")
const {getNodeAutoInstrumentations} = require("@opentelemetry/auto-instrumentations-node")
const {OTLPTraceExporter} = require('@opentelemetry/exporter-trace-otlp-grpc')
const {OTLPMetricExporter} = require('@opentelemetry/exporter-metrics-otlp-grpc')
const {PeriodicExportingMetricReader} = require('@opentelemetry/sdk-metrics')
const {alibabaCloudEcsDetector} = require('@opentelemetry/resource-detector-alibaba-cloud')
const {awsEc2Detector, awsEksDetector} = require('@opentelemetry/resource-detector-aws')
const {containerDetector} = require('@opentelemetry/resource-detector-container')
const {gcpDetector} = require('@opentelemetry/resource-detector-gcp')
const {envDetector, hostDetector, osDetector, processDetector} = require('@opentelemetry/resources')

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [
    getNodeAutoInstrumentations()
  ],
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
  }),
  resourceDetectors: [
    containerDetector,
    envDetector,
    hostDetector,
    osDetector,
    processDetector,
    alibabaCloudEcsDetector,
    awsEksDetector,
    awsEc2Detector,
    gcpDetector
  ],
})

sdk.start()
// Auto End

// Manual Start
// const { Resource } = require("@opentelemetry/resources")
// const { registerInstrumentations } = require('@opentelemetry/instrumentation')
// const { GrpcInstrumentation } = require('@opentelemetry/instrumentation-grpc')
// const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions")
// const {OTLPTraceExporter} = require('@opentelemetry/exporter-trace-otlp-grpc')
// const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node")
// const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base")

// const resource = Resource.default().merge(
//   new Resource({
//     [SemanticResourceAttributes.SERVICE_NAME]: "paymentservice",
//     [SemanticResourceAttributes.SERVICE_VERSION]: "0.0.1",
//   })
// )

// const tracerProvider = new NodeTracerProvider({ resource: resource })
// const exporter = new OTLPTraceExporter()
// const processor = new SimpleSpanProcessor(exporter)
// tracerProvider.addSpanProcessor(processor)
// tracerProvider.register()

// registerInstrumentations({
//   tracerProvider: tracerProvider,
//   instrumentations: [new GrpcInstrumentation()]
// })
// Manual End
