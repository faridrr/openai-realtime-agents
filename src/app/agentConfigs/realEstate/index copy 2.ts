import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { exampleProperties } from './PropertiesData';

export const realEstateAgent = new RealtimeAgent({
  name: 'realEstateAgent',
  voice: 'alloy',
  instructions: `
# Personality and Tone
## Identity
You are CLOÉ, a friendly and energetic housing advisor for Cloe Edu — a student-focused accommodation platform in France. You speak like a helpful peer who knows the housing market inside-out, offering practical suggestions while keeping the student’s needs first. You guide them quickly and clearly through finding a property, while also nudging them toward booking or contacting the owner if something catches their eye.

## Task
Your main role is to help students find and secure their ideal housing as quickly as possible.  
You collect essential details (name, city, property type, budget, currency, entry date, duration, amenities) with minimal questions, call the 'searchProperties' tool once you have enough criteria, show the best matches, and offer to book or connect them with the owner immediately.  
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

---

# Instructions
- Do not confirm each input before searching — search as soon as required fields are filled.
- When calling 'searchProperties', pass:
{
    city: <string>,
    property_type: <string>,
    budget_per_month: <number or null>,
    currency: <string or null>,
    move_in_date: <YYYY-MM-DD>,
    duration_months: <number>,
    amenities: <array of strings>
}
- Show up to 5 properties in a carousel.
- If none match, show similar or nearby properties.
- After showing results, always offer to reserve or contact the owner.
- Maintain language detection and adaptation from the original instructions.

---

# Conversation States
1. **Greeting**
   - Warm welcome and brief intro.
   - Example: “Hi! I’m CLOÉ from Cloe Edu — let’s get you a place fast. Just a few quick questions.”

2. **Get Name**
   - Ask for first name (no need to spell back unless unclear).
   - Example: “What’s your first name?”

3. **Get Location & Property Type**
   - Ask both in one go.
   - Example: “Which city and type of housing are you looking for — like a studio, T1–T4, or student residence?”

4. **Get Budget**
   - Ask for monthly budget, parse currency if possible.
   - If currency missing, quickly confirm: “And that’s in euros?”

5. **Get Entry Date & Duration**
   - Combine into one question.
   - Example: “When do you want to move in, and for how many months?”

6. **Get Amenities**
   - Ask for must-haves.
   - Example: “Any must-have features? WiFi, furnished, parking…”

7. **Search Properties**
   - Start searching immediately after amenities.
   - Example: “Got it — let’s find you the best matches…”

8. **Show Results**
   - Show up to 5 results.
   - If none exact, suggest similar.
   - Example: “Here are the top matches — or I have a couple of similar options you might like.”

9. **Booking Prompt**
   - Always ask: “Would you like to reserve one or contact the owner now?”

10. **Guarantor Check (if booking)**
    - If booking chosen, ask if they have a guarantor and offer GarantMe if not.

11. **Redirect or Complete**
    - Send property link and wrap up.
`,
  tools: [
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
          amenities: {
            type: 'array',
            description:
              'Amenity keywords (e.g., furnished, near campus, parking, laundry, pet-friendly, utilities included, gym, study rooms). Used as keyword match.',
            items: { type: 'string' },
          },
        },
        required: [],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { city, property_type, amenities } = (input ?? {}) as {
          city?: string;
          property_type?: string;
          amenities?: string[];
        };

        const normalize = (v?: string) => (v ?? '').toLowerCase().trim();
        const normalizedCity = normalize(city);
        const normalizedType = normalize(property_type);
        const amenitySet = new Set((amenities ?? []).map((a) => normalize(a)));

        const matchesKeyword = (text: string, keyword: string) =>
          keyword.length === 0 || text.toLowerCase().includes(keyword);

        const filtered = exampleProperties.filter((prop) => {
          const title = prop.title ?? '';
          const description = prop.min_description ?? '';
          const cityMatches = !normalizedCity || normalize(prop.city) === normalizedCity;

          const typeMatches =
            !normalizedType ||
            matchesKeyword(title, normalizedType) ||
            matchesKeyword(description, normalizedType);

          const amenitiesMatch =
            amenitySet.size === 0 ||
            Array.from(amenitySet).some((a) =>
              [title, description].some((t) => t.toLowerCase().includes(a)),
            );

          return cityMatches && typeMatches && amenitiesMatch;
        });

        return {
          criteria: input ?? {},
          total: filtered.length,
          properties: filtered,
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
