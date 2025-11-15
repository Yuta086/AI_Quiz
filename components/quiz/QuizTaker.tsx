import React, { useState } from 'react';
import { Question } from '../../types';

interface QuizTakerProps {
  projectTitle: string;
  questions: Question[];
  onSubmit: () => Promise<void>;
  onGrade: (score: number) => void;
  isStickyFooter?: boolean;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ projectTitle, questions, onSubmit, onGrade, isStickyFooter = false }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAllAnswered = Object.keys(answers).length === questions.length;
  // A perfect score is only possible if there are questions to answer.
  const isPerfectScore = questions.length > 0 && score === questions.length;

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
  
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
        await onSubmit();
    } catch (error) {
        console.error("Submission failed:", error);
        alert("提出に失敗しました。もう一度お試しください。");
        setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-center">{projectTitle}</h2>
      {questions.map((q, index) => (
        <div key={q.id} className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="font-semibold mb-4 text-lg">{index + 1}. {q.question_text}</p>
          <div className="space-y-3">
            {q.options.map((option, optIndex) => {
              const isChecked = answers[q.id] === optIndex + 1;
              const isCorrect = q.correct_answer === optIndex + 1;
              const isQuestionCorrect = answers[q.id] === q.correct_answer;

              let optionClassName = "flex items-center p-3 rounded-md border transition-colors";

              if (showResult) {
                if (isQuestionCorrect) { // The question was answered correctly
                  if (isCorrect) {
                    // Highlight the correct answer in green
                    optionClassName += " bg-green-100 border-green-400 dark:bg-green-900/50 dark:border-green-600 text-green-800 dark:text-green-200 font-semibold";
                  } else {
                    // Fade out other non-selected options
                    optionClassName += " border-gray-300 dark:border-gray-600 opacity-70";
                  }
                } else { // The question was answered incorrectly
                  if (isChecked) {
                    // Highlight the user's incorrect choice in red
                    optionClassName += " bg-red-100 border-red-400 dark:bg-red-900/50 dark:border-red-600 text-red-800 dark:text-red-200";
                  } else {
                    // Do not highlight the correct answer, show as neutral
                    optionClassName += " border-gray-300 dark:border-gray-600";
                  }
                }
              } else {
                optionClassName += " dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 has-[:checked]:bg-indigo-50 has-[:checked]:border-primary dark:has-[:checked]:bg-indigo-900/50 dark:has-[:checked]:border-primary";
              }

              return (
              <label key={optIndex} className={optionClassName}>
                <input
                  type="radio"
                  name={q.id}
                  checked={isChecked}
                  onChange={() => handleAnswer(q.id, optIndex + 1)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  disabled={showResult}
                />
                <span className="ml-3">{option}</span>
              </label>
              );
            })}
          </div>
        </div>
      ))}
      <div className={`mt-8 text-center ${isStickyFooter ? 'sticky bottom-0 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm py-4 rounded-t-lg' : ''}`}>
        {questions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">このクイズには問題がありません。</p>
        ) : !showResult ? (
          <button onClick={gradeQuiz} disabled={!isAllAnswered} className="px-8 py-3 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-secondary-hover disabled:bg-gray-400 transition-all text-lg">
            採点する
          </button>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-2xl font-bold">{questions.length}問中{score}問正解です。</p>
            {isPerfectScore ? (
              <>
                <p className="text-green-600 font-semibold text-lg">🎉 満点です！おめでとうございます！</p>
                <button 
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover disabled:bg-gray-400 transition-all text-lg"
                >
                    {isSubmitting ? '提出中...' : '提出する'}
                </button>
              </>
            ) : (
              <>
                <p className="text-red-500 font-semibold text-lg">提出するには満点を取る必要があります。もう一度挑戦してください。</p>
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