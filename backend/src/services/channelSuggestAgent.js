// CHANNEL-SUGGEST agent — picks the right community channel for a draft
// post. One Jev Choice over `general` + every distro channel; the composer
// shows it as a suggestion chip, the user still decides (code owns the
// workflow, Jev supplies the judgment).

import Flavour from '../models/Flavour.js';
import { systemOne } from './jevClient.js';

export async function suggestChannel({ title = '', body = '' } = {}) {
  const flavours = await Flavour.find().select('distroId name').lean();
  const criteria = {
    general: 'General Linux chat — introductions, news, and anything off-topic',
  };
  for (const f of flavours) {
    criteria[f.distroId] = `Discussions specifically about ${f.name}`;
  }

  const data = await systemOne({
    state: { title: String(title).slice(0, 200), body: String(body).slice(0, 2000) },
    questions: {
      channel: {
        type: 'choice',
        instructions: {
          question: 'Which community channel best fits the draft post in `title` and `body`?',
          rubric:
            'Choose `general` for introductions, news, hardware-agnostic questions, and anything not tied to one distro. Choose a distro channel only when the post is specifically about installing, configuring, or troubleshooting THAT distro.',
        },
        criteria,
      },
    },
  });

  const answer = data?.answers?.channel;
  if (!answer || answer.type !== 'choice' || !answer.choice) {
    throw new Error('AI returned an unreadable suggestion. Please try again.');
  }
  const channel = String(answer.choice).toLowerCase();
  if (!criteria[channel]) {
    throw new Error('AI suggested an unknown channel.');
  }
  return {
    channel,
    confidence: typeof answer.confidence === 'number' ? answer.confidence : null,
  };
}
