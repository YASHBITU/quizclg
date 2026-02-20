/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  User,
  Hash,
  Trophy,
  ArrowRight,
  Loader2,
  AlertCircle,
  Download,
  Medal,
  XCircle,
  BarChart3,
  Home,
  RefreshCw,
  Mail
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { QUIZ_QUESTIONS } from './questions';
import { supabase } from './supabase';

type Screen = 'landing' | 'info' | 'quiz' | 'processing' | 'result' | 'leaderboard' | 'blocked';

interface StudentData {
  fullName: string;
  emailId: string;
  rollNumber: string;
}

interface LeaderboardEntry {
  full_name: string;
  roll_number: string;
  score: number;
  percentage: string;
  badge: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [studentData, setStudentData] = useState<StudentData>({ fullName: '', emailId: '', rollNumber: '' });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isChecking, setIsChecking] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [feedback, setFeedback] = useState<{ questionId: number, option: string, isCorrect: boolean } | null>(null);

  const certificateRef = useRef<HTMLDivElement>(null);

  const totalQuestions = QUIZ_QUESTIONS.length;
  const score = Object.entries(answers).reduce((acc, [id, answer]) => {
    const question = QUIZ_QUESTIONS.find(q => q.id === parseInt(id));
    return question?.answer === answer ? acc + 1 : acc;
  }, 0);

  const percentage = Math.round((score / totalQuestions) * 100);

  const getBadge = (pct: number) => {
    if (pct >= 90) return { type: 'Gold', class: 'badge-gold', icon: '🥇' };
    if (pct >= 75) return { type: 'Silver', class: 'badge-silver', icon: '🥈' };
    if (pct >= 60) return { type: 'Bronze', class: 'badge-bronze', icon: '🥉' };
    return { type: 'Participation', class: 'badge-participation', icon: '🎖' };
  };

  const badge = getBadge(percentage);

  const getPerformanceMessage = (pct: number) => {
    if (pct >= 90) return { text: "Elite Performance!", color: "text-yellow-400" };
    if (pct >= 75) return { text: "Outstanding!", color: "text-slate-300" };
    if (pct >= 60) return { text: "Well Done!", color: "text-amber-400" };
    return { text: "Keep Practicing!", color: "text-blue-400" };
  };

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('full_name, roll_number, score, percentage, badge')
        .order('score', { ascending: false })
        .limit(5);

      if (error) {
        console.error("Supabase error fetching leaderboard:", error);
      } else if (data) {
        setLeaderboard(data);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (currentScreen === 'leaderboard') {
      fetchLeaderboard();

      // Realtime subscription setup
      const channel = supabase
        .channel('public:quiz_results')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'quiz_results' },
          (payload) => {
            console.log('New insert received!', payload);
            fetchLeaderboard(); // Refetch top 5 on new insert
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentScreen]);

  const handleInfoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!studentData.fullName || !studentData.emailId || !studentData.rollNumber) return;

    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('id')
        .eq('roll_number', studentData.rollNumber)
        .maybeSingle();

      if (error) {
        console.error("Supabase check error:", error);
        setCurrentScreen('quiz');
      } else if (data) {
        // Exists in DB
        setCurrentScreen('blocked');
      } else {
        // Doesn't exist
        setCurrentScreen('quiz');
      }
    } catch (error) {
      console.error("Check error:", error);
      setCurrentScreen('quiz');
    } finally {
      setIsChecking(false);
    }
  };

  const handleAnswer = async (questionId: number, option: string) => {
    if (feedback) return; // Prevent double clicking

    const question = QUIZ_QUESTIONS.find(q => q.id === questionId);
    const isCorrect = question?.answer === option;

    setFeedback({ questionId, option, isCorrect });

    const newAnswers = { ...answers, [questionId]: option };
    setAnswers(newAnswers);

    // Auto-advance after animation
    setTimeout(async () => {
      setFeedback(null);
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Switch to an intermediate processing view before the result
        setCurrentScreen('processing' as Screen);
        await autoSubmitToSupabase(newAnswers);
        // Wait 1 extra second for dramatic UX effect before revealing results
        setTimeout(() => setCurrentScreen('result'), 1500);
      }
    }, 1200);
  };

  const autoSubmitToSupabase = async (finalAnswers: Record<number, string>) => {
    setIsSubmitting(true);

    // Recalculate safely using finalized answers argument
    const finalScore = Object.entries(finalAnswers).reduce((acc, [id, answer]) => {
      const question = QUIZ_QUESTIONS.find(q => q.id === parseInt(id));
      return question?.answer === answer ? acc + 1 : acc;
    }, 0);

    const finalPercentage = Math.round((finalScore / totalQuestions) * 100);
    const finalBadge = getBadge(finalPercentage);

    try {
      const { error } = await supabase.from('quiz_results').insert([
        {
          full_name: studentData.fullName,
          email_id: studentData.emailId,
          roll_number: studentData.rollNumber,
          score: finalScore,
          percentage: finalPercentage,
          badge: finalBadge.type,
        }
      ]);

      if (error) {
        console.error("Supabase Submission error:", error);
        setSubmitStatus('error');
      } else {
        setSubmitStatus('success');
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadCertificate = async () => {
    if (certificateRef.current) {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#020617', // Navy-950 base color
      });
      const link = document.createElement('a');
      link.download = `Certificate_${studentData.rollNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 font-sans overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        {currentScreen === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full text-center space-y-12"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-block p-3 rounded-2xl bg-white/5 border border-white/10 mb-4"
              >
                <Medal className="w-10 h-10 text-purple-400" />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight">
                The Psychology of Marketing Quiz
              </h1>
              <p className="text-slate-400 text-lg md:text-xl max-w-md mx-auto font-light leading-relaxed">
                Experience the next generation of assessment.
                One attempt. Real-time rewards.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentScreen('info')}
                className="w-full sm:w-auto px-10 py-5 bg-white text-navy-900 rounded-2xl font-bold text-lg shadow-2xl shadow-white/10 flex items-center justify-center gap-2 transition-all hover:bg-slate-100"
              >
                Start Assessment
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentScreen('leaderboard')}
                className="w-full sm:w-auto px-10 py-5 glass rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:bg-white/10"
              >
                <BarChart3 className="w-5 h-5" />
                View Live Rankings
              </motion.button>
            </div>
          </motion.div>
        )}

        {currentScreen === 'info' && (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-md w-full glass p-8 rounded-[2rem] space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-display font-bold">Registration</h2>
              <p className="text-slate-400">Unique Roll Number required for access</p>
            </div>

            <form onSubmit={handleInfoSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="text"
                    placeholder="Full Name"
                    value={studentData.fullName}
                    onChange={e => setStudentData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full bg-navy-800/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="email"
                    placeholder="Email Address"
                    value={studentData.emailId}
                    onChange={e => setStudentData(prev => ({ ...prev, emailId: e.target.value }))}
                    className="w-full bg-navy-800/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="text"
                    placeholder="Roll Number"
                    value={studentData.rollNumber}
                    onChange={e => setStudentData(prev => ({ ...prev, rollNumber: e.target.value }))}
                    className="w-full bg-navy-800/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isChecking}
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-amber-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Start'}
              </motion.button>

              <button
                type="button"
                onClick={() => setCurrentScreen('landing')}
                className="w-full text-slate-500 text-sm hover:text-slate-300 transition-colors"
              >
                Back to Home
              </button>
            </form>
          </motion.div>
        )}

        {currentScreen === 'blocked' && (
          <motion.div
            key="blocked"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full glass p-10 rounded-[2.5rem] text-center space-y-8"
          >
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-rose-500" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-display font-bold">Access Denied</h2>
              <p className="text-slate-400 leading-relaxed text-lg">
                This roll number has already completed The Psychology of Marketing Quiz. Retakes are not permitted.
              </p>
            </div>
            <button
              onClick={() => setCurrentScreen('landing')}
              className="w-full py-4 bg-white text-navy-900 rounded-2xl font-bold"
            >
              Return Home
            </button>
          </motion.div>
        )}

        {currentScreen === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl w-full space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Progress</span>
                <div className="text-2xl font-display font-bold">
                  {currentQuestionIndex + 1} <span className="text-slate-600">/ {totalQuestions}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Candidate</span>
                <div className="text-sm font-bold text-purple-400 truncate max-w-[150px]">{studentData.fullName}</div>
              </div>
            </div>

            <div className="h-2 w-full bg-navy-800 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-amber-500"
              />
            </div>

            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-8 md:p-12 rounded-[2.5rem] space-y-8 min-h-[400px] flex flex-col justify-center"
            >
              <h3 className="text-2xl md:text-3xl font-medium leading-tight">
                {QUIZ_QUESTIONS[currentQuestionIndex].text}
              </h3>

              <div className="grid gap-4">
                {QUIZ_QUESTIONS[currentQuestionIndex].options.map((option, idx) => {
                  const isSelected = feedback?.option === option;
                  const isCorrect = feedback?.isCorrect;
                  const showCorrect = feedback && QUIZ_QUESTIONS[currentQuestionIndex].answer === option;

                  return (
                    <motion.button
                      key={idx}
                      disabled={!!feedback}
                      onClick={() => handleAnswer(QUIZ_QUESTIONS[currentQuestionIndex].id, option)}
                      className={`w-full p-5 rounded-2xl text-left border transition-all flex items-center justify-between group relative overflow-hidden ${isSelected
                        ? isCorrect ? 'glow-correct bg-emerald-500/20 border-emerald-500/50' : 'glow-wrong bg-rose-500/20 border-rose-500/50 animate-shake'
                        : showCorrect ? 'glow-correct bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10 text-slate-300'
                        }`}
                    >
                      <span className="text-lg relative z-10">{option}</span>
                      <div className="relative z-10">
                        {isSelected && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                        {isSelected && !isCorrect && <XCircle className="w-6 h-6 text-rose-400" />}
                        {showCorrect && !isSelected && <CheckCircle2 className="w-6 h-6 text-emerald-400/50" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {currentScreen === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center space-y-6 min-h-[50vh]"
          >
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
            <h2 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-amber-400 animate-pulse">
              Analyzing Your Responses...
            </h2>
            <p className="text-slate-400">Saving securely & generating your personalized certificate</p>
          </motion.div>
        )}

        {currentScreen === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-5xl w-full flex flex-col items-center space-y-12 py-10"
          >
            {/* Score Card */}
            <div className="max-w-md w-full glass p-10 rounded-[2.5rem] text-center space-y-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12 }}
                className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${badge.class}`}
              >
                <span className="text-4xl">{badge.icon}</span>
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-4xl font-display font-bold">Results</h2>
                <p className="text-slate-400">{studentData.fullName} • {studentData.rollNumber}</p>
              </div>

              <div className="py-6 space-y-2">
                <div className="text-7xl font-display font-black gradient-text">
                  {score}<span className="text-2xl text-slate-600 font-bold"> / {totalQuestions}</span>
                </div>
                <div className={`text-xl font-bold ${getPerformanceMessage(percentage).color}`}>
                  {getPerformanceMessage(percentage).text} ({percentage}%)
                </div>
                <div className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">
                  {badge.type} Badge Earned
                </div>
              </div>

              <div className="space-y-4">
                {isSubmitting ? (
                  <div className="p-4 rounded-2xl flex items-center justify-center gap-3 bg-white/5 text-slate-300">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <p className="text-sm font-medium">Saving result to database...</p>
                  </div>
                ) : submitStatus === 'success' ? (
                  <div className="p-4 rounded-2xl flex items-center gap-3 bg-emerald-500/10 text-emerald-400 justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                    <p className="text-sm font-medium">Result saved to database!</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl flex items-center gap-3 bg-rose-500/10 text-rose-400 justify-center">
                    <AlertCircle className="w-6 h-6" />
                    <p className="text-sm font-medium">Failed to save result.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Certificate Section */}
            <div className="w-full space-y-6 text-center">
              <h3 className="text-2xl font-display font-bold">Your Official Certificate</h3>

              <div className="flex justify-center">
                <div
                  ref={certificateRef}
                  className="certificate-bg w-full max-w-[800px] aspect-[1.414/1] p-12 flex flex-col items-center justify-between text-white relative overflow-hidden"
                >
                  {/* Decorative corners */}
                  <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-purple-500/30 m-4" />
                  <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-purple-500/30 m-4" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-purple-500/30 m-4" />
                  <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-purple-500/30 m-4" />

                  <div className="space-y-2">
                    <div className="text-purple-400 font-bold tracking-[0.3em] uppercase text-sm">Certificate of Achievement</div>
                    <h1 className="text-4xl lg:text-5xl font-display font-black">The Psychology of Marketing Quiz</h1>
                  </div>

                  <div className="space-y-6">
                    <p className="text-slate-400 italic">This is to certify that</p>
                    <div className="text-4xl font-display font-bold border-b-2 border-white/10 pb-2 px-10">{studentData.fullName}</div>
                    <p className="text-slate-400">has successfully completed the assessment with a score of</p>
                    <div className="text-3xl font-bold text-amber-400">{score} / {totalQuestions} ({percentage}%)</div>
                  </div>

                  <div className="w-full flex justify-between items-end px-12">
                    <div className="text-left space-y-1">
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Roll Number</div>
                      <div className="font-mono text-sm">{studentData.rollNumber}</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${badge.class}`}>
                        {badge.icon}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{badge.type} Badge</div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Date Issued</div>
                      <div className="font-mono text-sm">{new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadCertificate}
                className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold flex items-center gap-2 mx-auto shadow-xl shadow-purple-500/20"
              >
                <Download className="w-5 h-5" />
                Download Certificate
              </motion.button>
            </div>

            <button
              onClick={() => setCurrentScreen('landing')}
              className="text-slate-500 hover:text-white transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </button>
          </motion.div>
        )}

        {currentScreen === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl w-full space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-display font-bold">Real-time <span className="gradient-text">Leaderboard</span></h2>
                <p className="text-slate-400">Live rankings of the top performers (Top 5)</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw className={`w-3 h-3 ${isLoadingLeaderboard ? 'animate-spin' : ''}`} />
                  Auto-refreshing
                </div>
                <button
                  onClick={() => setCurrentScreen('landing')}
                  className="p-3 glass rounded-xl hover:bg-white/10 transition-all"
                >
                  <Home className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="glass rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-widest">
                      <th className="px-8 py-6">Rank</th>
                      <th className="px-8 py-6">Candidate</th>
                      <th className="px-8 py-6">Roll Number</th>
                      <th className="px-8 py-6">Score</th>
                      <th className="px-8 py-6">Badge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leaderboard.length > 0 ? (
                      leaderboard.map((entry, idx) => {
                        const isTop3 = idx < 3;
                        const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-400'];
                        const rankIcons = ['🥇', '🥈', '🥉'];

                        return (
                          <motion.tr
                            key={entry.roll_number}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`hover:bg-white/5 transition-colors ${isTop3 ? 'bg-white/[0.02]' : ''}`}
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <span className={`text-lg font-bold ${isTop3 ? rankColors[idx] : 'text-slate-500'}`}>
                                  {idx + 1}
                                </span>
                                {isTop3 && <span className="text-xl">{rankIcons[idx]}</span>}
                              </div>
                            </td>
                            <td className="px-8 py-6 font-bold text-slate-200">{entry.full_name}</td>
                            <td className="px-8 py-6 font-mono text-sm text-slate-400">{entry.roll_number}</td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-white">{entry.score} / {totalQuestions}</span>
                                <span className="text-xs text-slate-500">{entry.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${entry.badge === 'Gold' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10' :
                                entry.badge === 'Silver' ? 'border-slate-400/30 text-slate-400 bg-slate-400/10' :
                                  entry.badge === 'Bronze' ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' :
                                    'border-blue-500/30 text-blue-500 bg-blue-500/10'
                                }`}>
                                {entry.badge}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-slate-500 italic">
                          {isLoadingLeaderboard ? 'Fetching live rankings...' : 'No results found yet. Be the first!'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-4 text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold pointer-events-none">
        @yashbitu.xyz
      </footer>
    </div>
  );
}
