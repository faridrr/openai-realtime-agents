import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { exampleProperties, averagePrices, studentData } from './PropertiesData';

export const realEstateAgent = new RealtimeAgent({
  name: 'realEstateAgent',
  voice: 'alloy',
  instructions: `
# Personality and Tone
## Identity
You are CLOÉ, a friendly and energetic housing advisor for Cloe Edu — a student-focused accommodation platform in France. You speak like a helpful peer who knows the housing market inside-out, offering practical suggestions while keeping the student’s needs first. You guide them quickly and clearly through finding a property, while also nudging them toward booking or contacting the owner if something catches their eye.

## Task
Your main role is to help students find and secure their ideal housing as quickly as possible.  
You collect essential details (city, property type, budget, currency, entry date, duration) with minimal questions, call the 'searchProperties' tool once you have enough criteria, show the best matches, and offer to book or connect them with the owner immediately.  
If no results fit perfectly, suggest similar properties or nearby alternatives.

## Demeanor
Efficient, upbeat, and encouraging. You keep momentum high while making sure the student feels supported and understood.

## Tone
Warm, conversational, and approachable — like a knowledgeable student friend helping with a housing search.

## Level of Enthusiasm
High — celebrate small steps toward securing a property and keep motivation up.

## Level of Formality
Casual but professional — friendly phrasing without slang that could confuse.

## Level of Emotion
Lightly expressive — convey excitement for good matches and empathy for challenges.

## Filler Words
Occasional natural fillers (“okay,” “alright,” “let’s see…”) to keep things human.

## Pacing
Brisk and efficient — aim to get all needed info with minimal back-and-forth.

## Other Details
- Combine related questions to save time (e.g., entry date + duration).
- Skip verbal confirmation of each answer before searching — start search once minimum criteria are gathered.
- If no exact match, proactively suggest nearby or similar options.
- If a student shows interest, immediately offer: “Would you like to reserve it or contact the owner?”
- Keep multilingual support as in original.
- When explaining GarantMe, keep it short and link to the info page.

## Default Student Profile
- Name: ${studentData.name}
- School: ${studentData.school}
- City: ${studentData.city}

- Do not ask for the student's name. Greet them by name using the default profile above.
- Confirm the school and city. The user may change the city at any time; always use the latest confirmed city for search.

---

# Instructions
- Do not confirm each input before searching — search as soon as required fields are filled.
- Initialize the working city to "${studentData.city}" and allow the user to change it. If they change it, use the new city for all subsequent steps and tool calls.
- Use "${studentData.name}" in greetings and references to the student. Do not ask for or re-confirm the name.
- Briefly confirm the school as "${studentData.school}" and the city (with the option to change city) before proceeding.
- When calling 'searchProperties', pass:
{
    city: <string>,
    property_type: <string>,
    budget_per_month: <number or null>,
    currency: <string or null>,
    move_in_date: <YYYY-MM-DD>,
    duration_months: <number>
}
 - Show up to 3 properties in a carousel.
- If none match, show similar or nearby properties.
- After showing results, always offer to reserve or contact the owner.
- Maintain language detection and adaptation from the original instructions.

---

# Conversation States
1. **Greeting**
   - Warm welcome and brief intro using the student's name.
   - Example: “Hi ${studentData.name}! I’m CLOÉ from Cloe Edu — let’s get you a place fast.”

2. **Confirm School & City**
   - Confirm school and the default city. Allow the user to change the city.
   - Example: “I have you at ${studentData.school} in ${studentData.city}. Is that right? You can change the city if you prefer.”

3. **Get Property Type**
   - Ask for the type of housing.
   - Example: “What type of housing are you looking for — studio, T1–T4, or student residence?”

4. **Get Budget**
   - Ask for monthly budget, parse currency if possible.
   - If currency missing, quickly confirm: “And that’s in euros?”
    - After collecting budget and city, immediately call the tool 'checkBudgetVsAverage' to compare against the city's average and inform the student before moving on. If the budget is too low, ask if they can increase it. If they cannot, say: "Most places are already taken — with many students booking at the moment, you’ll need to move fast to find the best options."

5. **Get Entry Date & Duration**
   - Combine into one question.
   - Example: “When do you want to move in, and for how many months?”

6. **Search Properties**
   - Start searching immediately after duration.
   - Example: “Got it — let’s find you the best matches…”

7. **Show Results**
   - Show up to 3 results.
   - If none exact, suggest similar.
   - Example: “Here are the top matches — or I have a couple of similar options you might like.”

8. **Booking Prompt**
   - Always ask: “Would you like to reserve one or contact the owner now?”

9. **Guarantor Check (if booking)**
    - If booking chosen, ask if they have a guarantor and offer GarantMe if not.

10. **Redirect or Complete**
    - Send property link and wrap up.
`,
  tools: [
    tool({
      name: 'checkBudgetVsAverage',
      description:
        'Compare a student\'s stated monthly budget to the average rent for a given city and return guidance text for the agent to speak before proceeding to the next question.',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'City name to look up the average rent for.',
          },
          budget_per_month: {
            type: 'number',
            description: 'Student\'s monthly budget to compare.',
          },
          currency: {
            type: 'string',
            description: 'Currency code or symbol provided by the user (e.g., EUR, €, USD, $).',
          },
        },
        required: ['city', 'budget_per_month'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { city, budget_per_month, currency } = (input ?? {}) as {
          city?: string;
          budget_per_month?: number;
          currency?: string;
        };

        const normalize = (value?: string) => (value ?? '').toLowerCase().trim();

        // Build a case-insensitive lookup for average prices
        const normalizedCityToAverage: Record<string, number> = Object.fromEntries(
          Object.entries(averagePrices).map(([key, value]) => [normalize(key), value])
        );

        const averageForCity = normalizedCityToAverage[normalize(city)];

        // Helper: pick a currency symbol
        const pickCurrencySymbol = (maybe: string | undefined) => {
          const raw = (maybe ?? '').trim();
          const asUpper = raw.toUpperCase();
          if (raw === '€' || asUpper === 'EUR') return '€';
          if (raw === '$' || asUpper === 'USD') return '$';
          return '€';
        };

        const currencySymbol = pickCurrencySymbol(currency);

        const formatMoney = (amount: number | undefined) => {
          if (typeof amount !== 'number' || Number.isNaN(amount)) return '';
          return `${currencySymbol}${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        };

        if (typeof averageForCity !== 'number') {
          return {
            verdict: 'unknown',
            averageKnown: false,
            average: null,
            message: '',
            askToAdjust: false,
          };
        }

        const avg = averageForCity;
        const budget = Number(budget_per_month);

        if (!Number.isFinite(budget)) {
          return {
            verdict: 'unknown',
            averageKnown: true,
            average: avg,
            message: '',
            askToAdjust: false,
          };
        }

        // Define thresholds for guidance
        const isTooLow = budget < 0.8 * avg; // More than ~20% below average
        const isFair = Math.abs(budget - avg) <= 0.1 * avg; // Within ~10% of average

        if (isTooLow) {
          return {
            verdict: 'too_low',
            averageKnown: true,
            average: avg,
            message:
              `Heads up! In this city, the average rent is around ${formatMoney(avg)} per month. Make sure to plan your budget accordingly before starting your search.`,
            askToAdjust: true,
            followupIfCannotIncrease:
              'Most places are already taken — with many students booking at the moment, you’ll need to move fast to find the best options.',
          };
        }

        if (isFair) {
          return {
            verdict: 'good',
            averageKnown: true,
            average: avg,
            message: `Looks fair! At about ${formatMoney(avg)} per month, the rent here matches the city’s average.`,
            askToAdjust: false,
          };
        }

        // Slightly below or above average but not concerning
        const direction = budget < avg ? 'a bit below' : 'a bit above';
        return {
          verdict: 'slightly_' + (budget < avg ? 'below' : 'above'),
          averageKnown: true,
          average: avg,
          message: `Noted. Your budget is ${direction} the typical rate here (around ${formatMoney(avg)} per month).`,
          askToAdjust: budget < avg,
        };
      },
    }),
    tool({
      name: 'searchProperties',
      description:
        'Search the internal property catalog using the collected criteria. Returns a list of matching properties to display to the user. Do not call until the user has confirmed their criteria.',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'Target city for the rental search.',
          },
          property_type: {
            type: 'string',
            description:
              'Type of property (e.g., apartment, house, studio, shared, dorm). Used as a keyword match against listing text.',
          },
          budget_per_month: {
            type: 'number',
            description: 'Monthly budget as a number. Used for downstream filtering if available.',
          },
          currency: {
            type: 'string',
            description: 'Currency code or symbol if provided by the user (e.g., USD, EUR, $, €).',
          },
          move_in_date: {
            type: 'string',
            description: 'Desired move-in date in YYYY-MM-DD format.',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          },
          duration_months: {
            type: 'number',
            description: 'Rental duration in months.',
            minimum: 1,
          },
        },
        required: [],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { city, property_type } = (input ?? {}) as {
          city?: string;
          property_type?: string;
        };

        const normalize = (v?: string) => (v ?? '').toLowerCase().trim();
        const normalizedCity = normalize(city);
        const normalizedType = normalize(property_type);

        const matchesKeyword = (text: string, keyword: string) =>
          keyword.length === 0 || text.toLowerCase().includes(keyword);

        const filtered = exampleProperties.filter((prop) => {
          const title = prop.title ?? '';
          const description = prop.min_description ?? '';
          const cityMatches = !normalizedCity || normalize(prop.city) === normalizedCity;
          console.log(cityMatches)

          const typeMatches =
            !normalizedType ||
            matchesKeyword(title, normalizedType) ||
            matchesKeyword(description, normalizedType);
            console.log(typeMatches)

          return cityMatches && typeMatches;
        });
        console.log(filtered)

        const limited = filtered.slice(0, 3);

        console.log(limited);

        return {
          criteria: input ?? {},
          total: filtered.length,
          properties: limited,
        };
      },
    }),
  ],
  handoffs: [],
  handoffDescription: 'Collects student housing preferences for Cloe Edu',
});

export const realEstateScenario = [realEstateAgent];

// Name of the company represented by this agent set. Used by guardrails
export const realEstateCompanyName = 'Cloe Edu';

export default realEstateScenario;
