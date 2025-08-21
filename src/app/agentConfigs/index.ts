import { createRealEstateAgent } from './realEstate';

import type { RealtimeAgent } from '@openai/agents/realtime';

// Map of scenario key -> array of RealtimeAgent objects
export const allAgentSets: Record<string, RealtimeAgent[]> = {
  realEstate: [createRealEstateAgent()],
};

export const defaultAgentSetKey = 'realEstate';
