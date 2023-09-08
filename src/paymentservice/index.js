// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const health = require('grpc-js-health-check')
const { trace, context, SpanStatusCode } = require('@opentelemetry/api')

const tracer = trace.getTracer('paymentservice')

const charge = require('./charge')
const logger = require('./logger')

function chargeServiceHandler(call, callback) {
  /**
   * 1. Demo: Use the active span from context.
   * Get the active span from the context.
   * This span is the `rpc` span from the injected gRPC instrumentation 
   * Use this span as the main span in the `chargeServiceHandler`
   */
  // const span = trace.getSpan(context.active())

  /**
   * 2. Demo: Create a new span and link a parent span
   * Get the active span from the context.
   * Create a context and pass the parent span as a param when creating a new span
   */
  // const parent = trace.getActiveSpan()
  // const ctx = trace.setSpan(context.active(), parent)
  // const span = tracer.startSpan('chargeServiceHandler', undefined, ctx)

  /**
   * 3. Demo: Create a new active span without the need to pass a parent span
   */
  return tracer.startActiveSpan('chargeServiceHandler', span => {
    try {
      const amount = call.request.amount

      /**
       * 4. Demo: Add span attributes and events for custom test specs
       */
      span.setAttributes({
        'app.payment.amount': parseFloat(`${amount.units}.${amount.nanos}`)
      })
      span.addEvent('Charge request received.', {
        'log.severity': 'info',
        'log.message': 'Charge request received.',
        'request': call.request,
      })

      const response = charge.charge(call.request)

      span.setStatus({ code: SpanStatusCode.OK })
      span.end()
      callback(null, response)

    } catch (err) {
      span.addEvent('Charge request error.', {
        'log.severity': 'warn',
        'log.message': 'Charge request error.',
        'error': err,
      })

      span.recordException(err)
      span.setStatus({ code: SpanStatusCode.ERROR })

      span.end()
      callback(err)
    }
  })
}

async function closeGracefully(signal) {
  server.forceShutdown()
  process.kill(process.pid, signal)
}

const otelDemoPackage = grpc.loadPackageDefinition(protoLoader.loadSync('demo.proto'))
const server = new grpc.Server()

server.addService(health.service, new health.Implementation({
  '': health.servingStatus.SERVING
}))

server.addService(otelDemoPackage.oteldemo.PaymentService.service, { charge: chargeServiceHandler })

server.bindAsync(`0.0.0.0:${process.env['PAYMENT_SERVICE_PORT']}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    return logger.error({ err })
  }

  logger.info(`PaymentService gRPC server started on port ${port}`)
  server.start()
}
)

process.once('SIGINT', closeGracefully)
process.once('SIGTERM', closeGracefully)
