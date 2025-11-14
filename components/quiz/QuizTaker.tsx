import React, { useState } from 'react';
import { Question } from '../../types';

interface QuizTakerProps {
  projectTitle: string;
  questions: Question[];
  onSubmit: () => void;
  onGrade: (score: number) => void;
  isStickyFooter?: boolean;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ projectTitle, questions, onSubmit, onGrade, isStickyFooter = false }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const isAllAnswered = Object.keys(answers).length === questions.length;
  const isPerfectScore = score === questions.length;

  const handleAnswer = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const gradeQuiz = () => {
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResult(true);
    onGrade(correctCount);
  };

  const tryAgain = () => {
    setAnswers({});
    setShowResult(false);
    setScore(0);
  };
  
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-center">{projectTitle}</h2>
      {questions.map((q, index) => (
        <div key={q.id} className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="font-semibold mb-4 text-lg">{index + 1}. {q.question_text}</p>
          <div className="space-y-3">
            {q.options.map((option, optIndex) => (
              <label key={optIndex} className="flex items-center p-3 rounded-md border dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 has-[:checked]:bg-indigo-50 has-[:checked]:border-primary dark:has-[:checked]:bg-indigo-900/50 dark:has-[:checked]:border-primary transition-colors">
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === optIndex + 1}
                  onChange={() => handleAnswer(q.id, optIndex + 1)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  disabled={showResult}
                />
                <span className="ml-3 text-gray-700 dark:text-gray-200">{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className={`mt-8 text-center ${isStickyFooter ? 'sticky bottom-0 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm py-4' : ''}`}>
        {!showResult && (
          <button onClick={gradeQuiz} disabled={!isAllAnswered} className="px-8 py-3 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-secondary-hover disabled:bg-gray-400 transition-all text-lg">
            採点する
          </button>
        )}
        {showResult && (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-xl font-bold">{questions.length}問中{score}問正解です。</p>
            {isPerfectScore ? (
              <>
                <p className="text-green-600 font-semibold">満点です！提出できます。</p>
                <button onClick={onSubmit} className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-all text-lg">
                    提出する
                </button>
              </>
            ) : (
              <>
                <p className="text-red-500 font-semibold">提出するには満点を取る必要があります。もう一度挑戦してください。</p>
                <button onClick={tryAgain} className="px-8 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-all text-lg">
                    再挑戦
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizTaker;
