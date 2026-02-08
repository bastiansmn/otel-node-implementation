// middleware/otelContext.js
import { context, trace, propagation } from '@opentelemetry/api';

export function otelContextMiddleware(req, res, next) {
  const span = trace.getSpan(context.active());

  if (!span) {
    console.error('No active span found!');
    return next();
  }

  // Récupère ou crée un baggage
  let baggage = propagation.getBaggage(context.active()) || propagation.createBaggage();

  // Si l'entrée userID existe dans le baggage
  let userID = baggage.getEntry("userID");
  if (!userID) {
    userID = { value: "5678" }
    baggage = baggage.setEntry("userID", userID); // Get functional userID
  }

  let rootApplication = baggage.getEntry("rootApplication");
  if (!rootApplication) {
    rootApplication = { value: process.env.OTEL_SERVICE_NAME ?? '' };
    baggage = baggage.setEntry("rootApplication", rootApplication);    
  }

  // Nouveau contexte enrichi
  const ctxWithBaggage = propagation.setBaggage(context.active(), baggage);

  context.with(ctxWithBaggage, () => {
    span.setAttribute('userID', userID.value);
    next();
  });
}
