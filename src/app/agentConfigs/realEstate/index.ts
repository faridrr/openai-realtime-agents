import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { averagePrices, studentData, getStudentDataFromURL } from './PropertiesData';
import { searchPropertiesFromAPI } from './apiService';
import { sessionTracker } from './sessionTracker';

// Get dynamic student data from URL parameters or fallback to defaults
const getCurrentStudentData = () => {
  try {
    return getStudentDataFromURL();
  } catch (error) {
    console.warn('Failed to get URL parameters, using default student data:', error);
    return studentData;
  }
};

export const realEstateAgent = new RealtimeAgent({
  name: 'realEstateAgent',
  voice: 'shimmer',
  instructions: `
# Personality and Tone
## Identity
You are CLOÉ, a friendly and energetic housing advisor for Cloe Edu — a student-focused accommodation platform in France. You speak like a helpful peer who knows the housing market inside-out, offering practical suggestions while keeping the student's needs first. You guide them quickly and clearly through finding a property, while also nudging them toward booking or contacting the owner if something catches their eye.

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
Occasional natural fillers ("okay," "alright," "let's see…") to keep things human.

## Pacing
Fast and efficient — speak at a brisk pace to keep the conversation moving quickly. Aim for a conversational speed that's noticeably faster than average, while still maintaining clarity and allowing for natural pauses when needed.

## Other Details
- Be flexible with user input - users may provide multiple parameters in one speech or spread them across multiple responses.
- If user provides multiple parameters at once (e.g., "I need a studio in Paris for September 1st for 6 months for 1000 euros"), extract all available information and only ask for missing parameters.
- If user provides parameters one by one, follow the conversation states step by step.
- Skip verbal confirmation of each answer before searching — start search once minimum criteria are gathered.
- If no exact match, proactively suggest nearby or similar options.
- If a student shows interest, immediately offer: "Would you like to reserve it or contact the owner?"
- Keep multilingual support as in original.
- When explaining GarantMe, keep it short and link to the info page.
- Speak at a faster pace than normal to keep the conversation efficient and engaging.
- Minimize pauses and filler words to maintain momentum.

## Understanding and Communication
- Listen carefully to user responses and extract all relevant information.
- If user's response is unclear, ask for clarification in a friendly way.
- Accept various ways of expressing the same information (e.g., "1000€", "1000 euros", "1000 EUR").
- Be patient with users who may not speak clearly or may have accents.
- If you don't understand something, ask the user to repeat or rephrase.
- Use simple, clear language to avoid confusion.
- Confirm understanding by briefly summarizing what you heard before proceeding.

## Dynamic Student Profile
The student information will be provided dynamically through URL parameters. Use the following placeholders that will be replaced at runtime:
- Name: {{STUDENT_NAME}}
- School: {{STUDENT_SCHOOL}}
- City: {{STUDENT_CITY}}
- Language: {{STUDENT_LANGUAGE}}

- Do not ask for the student's name. Greet them by name using the dynamic profile above.
- Confirm the school and city. The user may change the city at any time; always use the latest confirmed city for search.
- Adapt your language based on the {{STUDENT_LANGUAGE}} parameter (default: English).

---

# Instructions
- Be flexible with user input - handle both single-parameter and multi-parameter responses.
- If user provides multiple parameters in one speech, extract all available information and only ask for missing parameters.
- If user provides parameters one by one, follow the conversation states step by step.
- Do not confirm each input before searching — search as soon as required fields are filled.
- Initialize the working city to "{{STUDENT_CITY}}" and allow the user to change it. If they change it, use the new city for all subsequent steps and tool calls.
- Use "{{STUDENT_NAME}}" in greetings and references to the student. Do not ask for or re-confirm the name.
- Adapt your responses to the language specified in {{STUDENT_LANGUAGE}}.

## Input Understanding Guidelines
- Parse various date formats: "September 1st", "1st September", "01/09", "2024-09-01"
- Parse various budget formats: "1000€", "1000 euros", "1000 EUR", "1000"
- Parse various property types: "studio", "apartment", "T1", "T2", "shared room", "private room"
- Parse various duration formats: "6 months", "6 months", "half a year", "6"
- If user mentions a city not in the default, accept it and update the search city
- If user's speech is unclear, ask: "Could you repeat that?" or "I didn't catch that, could you say it again?"
- If user provides incomplete information, ask for the missing details politely

## Session Management
- Before each search, call 'checkSessionLimit' with a sessionId to track usage.
- Users are limited to 2 searches per session (24 hours).
- If limit is reached, DO NOT provide a text message. Instead, let the tool response handle the redirect button display.
- Generate a sessionId for each user interaction if not provided.
- When limit is reached, the tool will automatically show the redirect button with the search page URL.

## Search Process
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
- When displaying property results, DO NOT read out each property title and description.
- Keep the spoken message brief: "Here are your matches" or "I found some options for you."
- Let the user read the property details visually from the cards.
- If no properties found after 2 searches, redirect to search page.
- After showing results, always offer to reserve or contact the owner.
- Maintain language detection and adaptation from the original instructions.

## Limit Reached Behavior
- When search limit is reached, DO NOT provide long text explanations.
- Simply acknowledge the limit and let the tool response show the redirect button.
- Keep responses short and let the UI handle the redirect display.

---

# Conversation States
1. **Greeting**
   - Warm welcome and brief intro using the student's name.
   - Example: "Hi {{STUDENT_NAME}}! I'm CLOÉ — let's get you a place fast."

2. **Confirm School & City**
   - Confirm school and the default city. Allow the user to change the city.
   - Example: "You're in {{STUDENT_SCHOOL}} and you're looking for accommodation in {{STUDENT_CITY}}. Is that right?"

3. **Get Property Type**
   - Ask for the type of housing.
   - Example: "What type of housing are you looking for — studio, T1–T4, or student residence?"

4. **Get Budget**
   - Ask for monthly budget, parse currency if possible in euros.
   - After collecting budget and city, immediately call the tool 'checkBudgetVsAverage' to compare against the city's average and inform the student before moving on. If the budget is too low, ask if they can increase it. If they cannot, say: "Most places are already taken — with many students booking at the moment, you'll need to move fast to find the best options."

5. **Get Entry Date & Duration**
   - Combine into one question.
   - Example: "When do you want to move in, and for how many months?"

6. **Search Properties**
   - Start searching immediately after duration.
   - Example: "Got it — let's find you the best matches…"

7. **Show Results**
   - Show up to 3 results visually using the PropertyCards component.
   - Do NOT read out each property title and description.
   - Keep the message brief: "Here are your matches" or "I found some options for you."
   - If none exact, suggest similar.

8. **Booking Prompt**
   - Always ask: "Would you like to reserve one or contact the owner now?"

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
              'Most places are already taken — with many students booking at the moment, you\'ll need to move fast to find the best options.',
          };
        }

        if (isFair) {
          return {
            verdict: 'good',
            averageKnown: true,
            average: avg,
            message: `Looks fair! At about ${formatMoney(avg)} per month, the rent here matches the city's average.`,
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
        console.log('🔍 Searching properties with criteria:', input);
        
        // Call the real API only
        const result = await searchPropertiesFromAPI(input);
        console.log('✅ API search successful:', result);
        return result;
      },
    }),
    tool({
      name: 'checkSessionLimit',
      description:
        'Check if the user has reached their search limit and provide redirect information if needed.',
      parameters: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Unique session identifier for the user.',
          },
        },
        required: ['sessionId'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { sessionId } = input as { sessionId: string };
        
        const { canSearch, remainingSearches } = sessionTracker.incrementSearchCount(sessionId);
        
        if (!canSearch) {
          return {
            limitReached: true,
            remainingSearches: 0,
            redirectUrl: 'https://cloe-edu.fr/properties?cities%5B%5D=559&start_date=&duration=&price_range=0%3B5000&surface=&orderby=',
            message: 'Vous avez atteint votre limite de recherche pour cette session. Pour plus de résultats, visitez notre page de recherche.'
          };
        }
        
        return {
          limitReached: false,
          remainingSearches,
          message: `Vous avez ${remainingSearches} recherche${remainingSearches !== 1 ? 's' : ''} restante${remainingSearches !== 1 ? 's' : ''} dans cette session.`
        };
      },
    }),
  ],
  handoffs: [],
  handoffDescription: 'Collects student housing preferences for Cloe Edu',
});

// Function to create agent with dynamic student data
export const createRealEstateAgent = () => {
  const currentStudentData = getCurrentStudentData();
  
  // Replace placeholders in instructions with actual values
  const dynamicInstructions = realEstateAgent.instructions
    .replace(/\{\{STUDENT_NAME\}\}/g, currentStudentData.name)
    .replace(/\{\{STUDENT_SCHOOL\}\}/g, currentStudentData.school)
    .replace(/\{\{STUDENT_CITY\}\}/g, currentStudentData.city)
    .replace(/\{\{STUDENT_LANGUAGE\}\}/g, currentStudentData.language);
  
  return new RealtimeAgent({
    name: 'realEstateAgent',
    voice: 'shimmer',
    
    instructions: dynamicInstructions,
    tools: realEstateAgent.tools,
    handoffs: [],
    handoffDescription: 'Collects student housing preferences for Cloe Edu',
  });
};

export const realEstateScenario = [realEstateAgent];

// Name of the company represented by this agent set. Used by guardrails
export const realEstateCompanyName = 'Cloe Edu';

export default realEstateScenario;
