import { OBJECTIVE_TYPE } from '@/game/objectives/objectiveDefinitions'

// Sequential mission definitions. Mission mode runs objectives in order; the
// run completes when all stages finish (or integrity hits zero). Rewards stack
// into score on completion. Difficulty can also lock the environment phase.

export const MISSIONS = {
  campaign_1: {
    id: 'campaign_1',
    title: 'Highway Initiation',
    environment: 'day', // fixed environment phase for this mission
    stages: [
      {
        id: 'dist-2km',
        type: OBJECTIVE_TYPE.DISTANCE,
        title: 'Travel 2 km',
        description: 'Cover 2000 meters of road.',
        target: 2000,
        reward: 1000,
      },
      {
        id: 'overtake-10',
        type: OBJECTIVE_TYPE.OVERTAKES,
        title: 'Clean Passes',
        description: 'Overtake 10 vehicles without crashing.',
        target: 10,
        reward: 1500,
      },
      {
        id: 'speed-30s',
        type: OBJECTIVE_TYPE.MAINTAIN_SPEED,
        title: 'Hold the Line',
        description: 'Maintain at least 120 km/h for 30 seconds.',
        target: 30,
        reward: 2000,
      },
      {
        id: 'collisionfree-60',
        type: OBJECTIVE_TYPE.COLLISION_FREE,
        title: 'Clean Run',
        description: 'Stay collision-free for 60 seconds.',
        target: 60,
        reward: 2500,
      },
      {
        id: 'integrity-50',
        type: OBJECTIVE_TYPE.MINIMUM_INTEGRITY,
        title: 'Survive Intact',
        description: 'Finish with at least 50% integrity.',
        target: 50,
        reward: 3000,
      },
    ],
  },
}

// Endless-mode rotating optional challenges. Failing one must NOT end the run.
// We rotate through a pool; only one is active at a time.
export const ENDLESS_CHALLENGES = [
  {
    id: 'end-nearmiss-5',
    type: OBJECTIVE_TYPE.NEAR_MISSES,
    title: 'Near Miss Streak',
    description: 'Pull off 5 near misses.',
    target: 5,
    reward: 800,
  },
  {
    id: 'end-overtake-15',
    type: OBJECTIVE_TYPE.OVERTAKES,
    title: 'Overtaking Frenzy',
    description: 'Overtake 15 vehicles.',
    target: 15,
    reward: 1200,
  },
  {
    id: 'end-distance-3km',
    type: OBJECTIVE_TYPE.DISTANCE,
    title: 'Long Haul',
    description: 'Travel 3 kilometers.',
    target: 3000,
    reward: 1000,
  },
  {
    id: 'end-score-20k',
    type: OBJECTIVE_TYPE.SCORE,
    title: 'High Roller',
    description: 'Reach a score of 20,000.',
    target: 20000,
    reward: 1500,
  },
]

export function getMission(id) {
  return MISSIONS[id] || MISSIONS.campaign_1
}
