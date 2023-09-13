// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

const opentelemetry = require('@opentelemetry/api')
const {context, propagation, trace, metrics} = opentelemetry
const cardValidator = require('simple-card-validator')
const { v4: uuidv4 } = require('uuid')

const logger = require('./logger')
const tracer = trace.getTracer('paymentservice')
const meter = metrics.getMeter('paymentservice')
const transactionsCounter = meter.createCounter('app.payment.transactions')

module.exports.charge = request => {
  /**
   * 1. Demo: Use the active span from context.
   * Get the active span from the context.
   * This span is the `rpc` span from the injected gRPC instrumentation 
   * Use this span as the main span in the `chargeServiceHandler`
   */
  // const span = trace.getActiveSpan()

  /**
   * 2. Demo: Create a new span and link a parent span
   * Get the active span from the context.
   * Create a context and pass the parent span as a param when creating a new span
   */
  // const parent = trace.getActiveSpan()
  // const ctx = trace.setSpan(context.active(), parent)
  // const span = tracer.startSpan('charge', undefined, ctx)

  /**
   * 3. Demo: Create a new active span without the need to pass a parent span
   */
  const span = tracer.startSpan('charge')

  const {
    creditCardNumber: number,
    creditCardExpirationYear: year,
    creditCardExpirationMonth: month
  } = request.creditCard
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const lastFourDigits = number.substr(-4)
  const transactionId = uuidv4()

  const card = cardValidator(number)
  const { card_type: cardType, valid } = card.getCardDetails()

  /**
   * 1. Demo: Add span attributes and events for custom test specs
   */
  span.setAttributes({
    'app.payment.card_type': cardType,
    'app.payment.card_valid': valid
  })

  if (!valid) {
    throw new Error('Credit card info is invalid.')
  }

  if (!['visa', 'mastercard'].includes(cardType)) {
    throw new Error(`Sorry, we cannot process ${cardType} credit cards. Only VISA or MasterCard is accepted.`)
  }

  if ((currentYear * 12 + currentMonth) > (year * 12 + month)) {
    throw new Error(`The credit card (ending ${lastFourDigits}) expired on ${month}/${year}.`)
  }

  // check baggage for synthetic_request=true, and add charged attribute accordingly
  const baggage = propagation.getBaggage(context.active())
  if (baggage && baggage.getEntry("synthetic_request") && baggage.getEntry("synthetic_request").value === "true") {
    span.setAttribute('app.payment.charged', false)
  } else {
    span.setAttribute('app.payment.charged', true)
  }

  /**
   * 1. Demo: Use the active span from context.
   * End the span.
   */
  span.end()

  const { units, nanos, currencyCode } = request.amount
  logger.info({transactionId, cardType, lastFourDigits, amount: { units, nanos, currencyCode }}, "Transaction complete.")
  transactionsCounter.add(1, {"app.payment.currency": currencyCode})
  return { transactionId }
}
