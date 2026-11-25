'use client';

import { useState } from 'react';

const lessons = {
  AI: {
    Starter: [
      'Write a prompt for an imaginary place.',
      'Change one detail. Compare both results.',
      'Explain which words changed the outcome.',
    ],
    Stretch: [
      'Design a character and a visual style.',
      'Keep both consistent across three scenes.',
      'Compare the prompts and explain your revisions.',
    ],
  },
  Web: {
    Starter: [
      'Pick a problem you run into at school.',
      'Sketch a page that could help solve it.',
      'Build one button that does something useful.',
    ],
    Stretch: [
      'Turn your page into a working prototype.',
      'Ask a classmate to use it without instructions.',
      'Fix the first thing that confused them.',
    ],
  },
  XR: {
    Starter: [
      'Pick an object you wish you could inspect.',
      'Sketch it from three different viewpoints.',
      'Decide what a visitor could touch or change.',
    ],
    Stretch: [
      'Build a small interactive 3D scene.',
      'Give the viewer a task to complete.',
      'Test the scene with someone seeing it for the first time.',
    ],
  },
};
type Topic = keyof typeof lessons;
type Level = 'Starter' | 'Stretch';

export function LessonLab() {
  const [topic, setTopic] = useState<Topic>('AI');
  const [level, setLevel] = useState<Level>('Starter');
  return (
    <div className="lesson-lab">
      <div className="studio-panel-heading">
        <h2>Make a mini lesson.</h2>
        <span className="lesson-mark" aria-hidden="true">
          Aa
        </span>
      </div>
      <p className="studio-panel-intro">
        Pick a subject. Pick a challenge. Start making.
      </p>
      <div className="lesson-controls">
        <fieldset>
          <legend>Explore</legend>
          <div className="lesson-options">
            {(Object.keys(lessons) as Topic[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTopic(value)}
                aria-pressed={topic === value}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Challenge</legend>
          <div className="lesson-options">
            {(['Starter', 'Stretch'] as Level[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setLevel(value)}
                aria-pressed={level === value}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <ol className="lesson-steps" key={`${topic}-${level}`}>
        {lessons[topic][level].map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <a className="text-link" href="#teaching">
        Meet the educator
      </a>
    </div>
  );
}
