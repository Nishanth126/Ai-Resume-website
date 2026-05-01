import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Briefcase, 
  Search, 
  ArrowRight, 
  Loader2, 
  Building2, 
  MapPin, 
  DollarSign, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Analysis {
  role: string;
  skills: string[];
  summary: string;
}

interface Job {
  id: string;
  company: string;
  title: string;
  location: string;
  matchScore: number;
  salary: string;
  status?: 'pending' | 'applying' | 'validating' | 'submitted';
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analysis' | 'dashboard'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      startAnalysis(uploadedFile);
    }
  };

  const startAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setCurrentStep('analysis');
    
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setAnalysis(data);
      
      // Fetch associated jobs
      const jobsResponse = await fetch('/api/match-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const jobsData = await jobsResponse.json();
      setJobs(jobsData.jobs);
      
      setTimeout(() => {
        setIsAnalyzing(false);
        setCurrentStep('dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setIsAnalyzing(false);
      alert('Analysis failed. Please try again.');
    }
  };

  const startAutoApply = () => {
    setIsApplying(true);
    
    // Simulate application process for each job with random delays
    jobs.forEach((job, index) => {
      const updateStatus = (status: Job['status'], delay: number) => {
        setTimeout(() => {
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status } : j));
        }, delay);
      };

      const baseDelay = index * 800;
      updateStatus('applying', baseDelay + 500);
      updateStatus('validating', baseDelay + 2500);
      updateStatus('submitted', baseDelay + 4500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight">AutoApply AI</span>
          </div>
          {analysis && (
            <div className="hidden md:flex items-center gap-4">
              <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200">
                Logged in as <span className="text-slate-900">User</span>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {currentStep === 'upload' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto text-center"
            >
              <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                Your Job Search, <span className="text-indigo-600">Automated.</span>
              </h1>
              <p className="text-lg text-slate-600 mb-12 max-w-lg mx-auto leading-relaxed">
                Upload your resume and let our AI engine analyze your profile, match you with top companies, and handle applications instantly.
              </p>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-slate-300 rounded-3xl p-12 bg-white hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer overflow-hidden shadow-sm"
              >
                <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Drop your resume here</h3>
                  <p className="text-slate-500 text-sm">Supports PDF, DOCX, and Text files</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt"
                />
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Search, title: "AI Analysis", desc: "Deep parsing of skills" },
                  { icon: Building2, title: "Smart Matching", desc: "Top company curation" },
                  { icon: Zap, title: "Auto-Apply", desc: "Instant submissions" }
                ].map((feature, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-100/50 border border-slate-200">
                    <feature.icon className="w-5 h-5 text-indigo-600 mb-2 mx-auto" />
                    <h4 className="font-semibold text-sm">{feature.title}</h4>
                    <p className="text-xs text-slate-500">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 'analysis' && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[50vh]"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-indigo-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                </div>
                <motion.div 
                  className="absolute inset-0 border-t-4 border-indigo-600 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <h2 className="text-2xl font-bold mb-2">Analyzing Resume</h2>
              <p className="text-slate-500 animate-pulse text-center">
                Our neural engine is extracting roles, identifying unique skills, and building your professional persona...
              </p>
              
              <div className="mt-8 space-y-3 w-full">
                {['Reading text layers...', 'Extracting core competencies...', 'Matching with industry sectors...'].map((text, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.4 }}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    {text}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 'dashboard' && analysis && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header Info */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                  <FileText className="w-10 h-10" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight">{analysis.role}</h2>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified Match
                    </span>
                  </div>
                  <p className="text-slate-600 max-w-2xl leading-relaxed">{analysis.summary}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {analysis.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-full md:w-auto shrink-0 pt-4 md:pt-0">
                  {!isApplying ? (
                    <button 
                      onClick={startAutoApply}
                      className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg shadow-indigo-100"
                    >
                      <Zap className="w-5 h-5 fill-current" />
                      Start Auto-Apply
                    </button>
                  ) : (
                    <div className="px-8 py-4 bg-green-50 text-green-700 font-bold rounded-2xl border border-green-200 flex items-center gap-3 animate-pulse">
                      <CheckCircle2 className="w-5 h-5" />
                      Campaign Active
                    </div>
                  )}
                </div>
              </div>

              {/* Jobs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {jobs.map((job, idx) => (
                  <motion.div 
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all flex flex-col group h-full"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <div className="text-indigo-600 font-bold text-lg">{job.matchScore}%</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Match</div>
                      </div>
                    </div>
                    
                    <div className="flex-1 mb-6">
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">{job.title}</h3>
                      <p className="text-sm font-medium text-slate-500 mb-4">{job.company}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <DollarSign className="w-3 h-3" /> {job.salary}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      {!job.status ? (
                        <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-slate-200" />
                          Ready for submission
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className={cn(
                            "text-xs font-bold flex items-center gap-2",
                            job.status === 'submitted' ? "text-green-600" : "text-indigo-600"
                          )}>
                            {job.status === 'applying' && <Loader2 className="w-3 h-3 animate-spin" />}
                            {job.status === 'validating' && <Search className="w-3 h-3 animate-pulse" />}
                            {job.status === 'submitted' && <CheckCircle2 className="w-3 h-3" />}
                            <span className="capitalize">{job.status}...</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                              className={cn(
                                "h-full bg-indigo-600",
                                job.status === 'submitted' && "bg-green-500"
                              )}
                              initial={{ width: "0%" }}
                              animate={{ 
                                width: 
                                  job.status === 'applying' ? "33%" : 
                                  job.status === 'validating' ? "66%" : 
                                  job.status === 'submitted' ? "100%" : "0%"
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Decoration */}
      <footer className="py-12 border-t border-slate-200 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-widest">Enterprise Grade Job Automation</span>
          </div>
          <p className="text-xs text-slate-400">
            © 2024 AutoApply AI Engine. All rights reserved. Built with Gemini 1.5 Pro.
          </p>
        </div>
      </footer>
    </div>
  );
}
