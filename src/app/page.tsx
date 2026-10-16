"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Shield,
  CheckCircle,
  Building2,
  MapPin,
  TrendingUp,
  FileText,
  Database,
  Activity,
  ArrowRight,
  Menu,
  X,
  Presentation,
  Target,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    // Intersection Observer for fade-in animations - wait for DOM to be ready
    const setupObserver = () => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-fade-in-up');
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      // Observe all elements with fade-in class
      const elements = document.querySelectorAll('.fade-in-on-scroll');
      elements.forEach((el) => observer.observe(el));

      return observer;
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const observer = setupObserver();
      return () => observer?.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Image 
                src="/headerlogo4k.png" 
                alt="PULSE" 
                width={120}
                height={43}
                className="h-8 sm:h-10 w-auto drop-shadow-lg brightness-110"
                priority
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('home')} className="text-white hover:text-blue-300 transition-colors">
                Home
              </button>
              <button onClick={() => scrollToSection('features')} className="text-white hover:text-blue-300 transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-white hover:text-blue-300 transition-colors">
                How It Works
              </button>
              <button onClick={() => scrollToSection('about')} className="text-white hover:text-blue-300 transition-colors">
                About
              </button>
              <button onClick={() => scrollToSection('download')} className="text-white hover:text-blue-300 transition-colors">
                Download
              </button>
              <Link href="/login">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  Login
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-700 text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mounted && (
          <div className={`md:hidden py-4 border-t border-slate-700 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
            <div className="flex flex-col space-y-4">
              <button onClick={() => scrollToSection('home')} className="text-left text-white hover:text-blue-300 transition-colors">
                Home
              </button>
              <button onClick={() => scrollToSection('features')} className="text-left text-white hover:text-blue-300 transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-left text-white hover:text-blue-300 transition-colors">
                How It Works
              </button>
              <button onClick={() => scrollToSection('about')} className="text-left text-white hover:text-blue-300 transition-colors">
                About
              </button>
              <button onClick={() => scrollToSection('download')} className="text-left text-white hover:text-blue-300 transition-colors">
                Download
              </button>
              <Link href="/login">
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  Login
                </Button>
              </Link>
            </div>
          </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden min-h-screen">
        {/* Background with animated blobs */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-blue-100 to-green-100">
            {/* Animated Blobs */}
            <div className="absolute top-10 left-0 w-64 h-64 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-20 right-20 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-6000"></div>
          </div>
        </div>
        
        <style jsx global>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -50px) scale(1.1); }
            50% { transform: translate(-20px, 20px) scale(0.9); }
            75% { transform: translate(50px, 50px) scale(1.05); }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes rotate3d {
            0% {
              transform: perspective(1000px) rotateY(0deg);
            }
            100% {
              transform: perspective(1000px) rotateY(360deg);
            }
          }
          .animate-blob {
            animation: blob 20s infinite;
          }
          .animate-rotate {
            animation: rotate 20s linear infinite;
          }
          .animate-rotate-3d {
            animation: rotate3d 8s linear infinite;
            transform-style: preserve-3d;
          }
          .animate-fade-in {
            animation: fadeIn 1s ease-out forwards;
          }
          .fade-in-on-scroll {
            opacity: 0;
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .animation-delay-6000 {
            animation-delay: 6s;
          }
          .stagger-1 {
            animation-delay: 0.1s;
          }
          .stagger-2 {
            animation-delay: 0.2s;
          }
          .stagger-3 {
            animation-delay: 0.3s;
          }
          .stagger-4 {
            animation-delay: 0.4s;
          }
        `}</style>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
            {/* Left Content */}
            <div className="space-y-6 animate-fade-in">
              {/* Radial glow behind card */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-radial from-blue-200/40 via-transparent to-transparent blur-3xl -z-10"></div>
                <div className="space-y-5 bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-2xl">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                    Understand<br/>
                    Citizen<br/>
                    Perception<br/>
                    <span className="text-blue-600">with PULSE</span>
                  </h1>
                  <p className="text-base md:text-lg text-gray-700 leading-loose">
                    Efficient survey management for local governance. Measure public satisfaction and service evaluation with real-time analytics.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button 
                    size="lg" 
                    className="bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 w-full sm:w-auto shadow-xl transition-all duration-300 text-lg py-6 px-8 group"
                  >
                    Access System
                    <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('features')}
                  className="w-full sm:w-auto border-2 border-gray-700 text-gray-700 hover:bg-gray-100 text-lg py-6 px-8"
                >
                  Learn More
                </Button>
              </div>
            </div>

            {/* Right Content - Image with more space */}
            <div className="relative flex flex-col items-center justify-center lg:items-end lg:pr-8 gap-8">
              <div className="relative w-full max-w-4xl mx-auto">
                {/* Soft gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-pink-100/20 to-blue-100/20 rounded-2xl -z-10"></div>
                <Image 
                  src="/test2.png" 
                  alt="PULSE Interface" 
                  width={900}
                  height={900}
                  className="w-full h-auto drop-shadow-2xl animate-fade-in opacity-90"
                  priority
                />
              </div>

              {/* In Partnership With — below the laptop image */}
              <div className="w-full text-center">
                <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-4">
                  In Partnership With:
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {[
                    { src: '/sulop-logo.jpg', alt: 'Municipality of Sulop',                          tooltip: 'Municipality of Sulop' },
                    { src: '/dilg.png',       alt: 'DILG',                                           tooltip: 'Department of Interior and Local Government' },
                    { src: '/mlgrc.png',      alt: 'MLGRC',                                          tooltip: 'Municipal Local Governance Resource Center' },
                    { src: '/umlogo.webp',    alt: 'University of Mindanao Digos College Branch',    tooltip: 'University of Mindanao Digos College Branch' },
                  ].map(({ src, alt, tooltip }) => (
                    <Tooltip key={alt} content={tooltip} position="bottom">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-center p-2 hover:shadow-md transition-shadow duration-200 cursor-pointer">
                        <Image
                          src={src}
                          alt={alt}
                          width={64}
                          height={64}
                          className="object-contain w-full h-full"
                        />
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="inline-block px-6 py-3 rounded-full text-3xl md:text-4xl font-bold text-blue-600 bg-blue-50">
                Ready
              </div>
              <div className="text-sm md:text-base text-gray-600 mt-3">For Deployment</div>
            </div>
            <div>
              <div className="inline-block px-6 py-3 rounded-full text-3xl md:text-4xl font-bold text-blue-600 bg-blue-50">
                Modern
              </div>
              <div className="text-sm md:text-base text-gray-600 mt-3">Technology Stack</div>
            </div>
            <div>
              <div className="inline-block px-6 py-3 rounded-full text-3xl md:text-4xl font-bold text-blue-600 bg-blue-50">
                Secure
              </div>
              <div className="text-sm md:text-base text-gray-600 mt-3">Data Protection</div>
            </div>
            <div>
              <div className="inline-block px-6 py-3 rounded-full text-3xl md:text-4xl font-bold text-blue-600 bg-blue-50">
                24/7
              </div>
              <div className="text-sm md:text-base text-gray-600 mt-3">System Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Simplified */}
      <section id="features" className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Core Features
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Everything you need to conduct, manage, and analyze surveys for better governance decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow fade-in-on-scroll stagger-1">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Survey Management</h3>
              <p className="text-gray-600">
                Create and manage survey cycles across multiple barangays with ease.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow fade-in-on-scroll stagger-2">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Assignment Tracking</h3>
              <p className="text-gray-600">
                Monitor interviewer assignments and track progress in real-time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow fade-in-on-scroll stagger-3">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Analytics</h3>
              <p className="text-gray-600">
                View completion rates and satisfaction scores with interactive dashboards.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow fade-in-on-scroll stagger-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Security</h3>
              <p className="text-gray-600">
                Government-grade security with role-based access control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How PULSE Works
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A streamlined workflow from survey creation to actionable insights.
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-blue-100"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-6 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center fade-in-on-scroll stagger-1">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg relative z-10">
                  1
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Create Cycle</h3>
                  <p className="text-sm text-gray-600">Set up survey cycle and targets</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center fade-in-on-scroll stagger-2">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg relative z-10">
                  2
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Assign</h3>
                  <p className="text-sm text-gray-600">Assign interviewers to barangays</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center fade-in-on-scroll stagger-3">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg relative z-10">
                  3
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Survey</h3>
                  <p className="text-sm text-gray-600">Conduct surveys and collect data</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center fade-in-on-scroll stagger-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg relative z-10">
                  4
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Track</h3>
                  <p className="text-sm text-gray-600">Monitor progress in real-time</p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center text-center fade-in-on-scroll stagger-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg relative z-10">
                  5
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Report</h3>
                  <p className="text-sm text-gray-600">Generate insights and reports</p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex flex-col items-center text-center fade-in-on-scroll stagger-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg relative z-10">
                  6
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <Presentation className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Utilize</h3>
                  <p className="text-sm text-gray-600">Present findings and facilitate workshop with BLGU officials</p>
                </div>
              </div>

              {/* Step 7 */}
              <div className="flex flex-col items-center text-center fade-in-on-scroll stagger-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg relative z-10">
                  7
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Act</h3>
                  <p className="text-sm text-gray-600">Formulate and monitor the Citizen Priority Action Plan (CPAP)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About & Benefits Combined Section */}
      <section id="about" className="py-20 md:py-32 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              About PULSE
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              PULSE (Public Understanding and Local Service Evaluation) is a comprehensive survey management system designed specifically for local government units. Our platform enables efficient data collection, real-time monitoring, and actionable insights to improve public service delivery.
            </p>
            <p className="text-lg text-gray-600">
              Built with modern technology and government-grade security, PULSE streamlines the entire survey lifecycle from planning to reporting.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center fade-in-on-scroll stagger-1">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Centralized Data</h3>
              <p className="text-gray-600">All survey data in one secure location</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm text-center fade-in-on-scroll stagger-2">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Accountability</h3>
              <p className="text-gray-600">Track every assignment and completion</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm text-center fade-in-on-scroll stagger-3">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Updates</h3>
              <p className="text-gray-600">Live progress tracking and monitoring</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm text-center fade-in-on-scroll stagger-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Better Decisions</h3>
              <p className="text-gray-600">Data-driven insights for policy making</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 md:py-32 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Privacy and Security First
              </h2>
              <p className="text-lg text-gray-600">
                Built with government-grade security standards to protect sensitive survey data and ensure compliance with data protection regulations.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Role-Based Access Control</h4>
                    <p className="text-gray-600">Granular permissions for admins, interviewers, and viewers</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Encrypted Data Storage</h4>
                    <p className="text-gray-600">All survey responses encrypted at rest and in transit</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Activity Monitoring</h4>
                    <p className="text-gray-600">Track user actions and system operations</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Data Protection</h4>
                    <p className="text-gray-600">Cloud infrastructure with automatic backups</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Security Image */}
            <div className="relative">
              <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-xl bg-white flex items-center justify-center p-8">
                <Image
                  src="/privacy.png"
                  alt="Security and Privacy"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download App Section */}
      <section id="download" className="py-20 md:py-32 bg-gradient-to-br from-blue-50 to-indigo-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Download PULSE App
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Get the mobile app for offline survey capabilities and better field experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Android Download */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Android</h3>
              <p className="text-gray-600 mb-6 text-center">
                Download the APK file and install on your Android device
              </p>
              <div className="space-y-4">
                <a 
                  href="/android-builds/Pulse-FI.apk" 
                  download
                  className="block w-full"
                >
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download APK
                  </Button>
                </a>
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-700">
                  <p className="font-semibold mb-2">Installation Steps:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Download the APK file</li>
                    <li>Open the downloaded file</li>
                    <li>Allow installation from unknown sources if prompted</li>
                    <li>Follow the installation wizard</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* iOS Installation */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">iOS (Safari)</h3>
              <p className="text-gray-600 mb-6 text-center">
                Add PULSE to your home screen as a web app
              </p>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-700">
                  <p className="font-semibold mb-2">Installation Steps:</p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Open <strong>https://mlgrc-pulse-ml.up.railway.app/</strong> in Safari</li>
                    <li>Tap the <strong>Share</strong> button 
                      <svg className="inline w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                      </svg>
                      (bottom center)
                    </li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> in the top right</li>
                    <li>The PULSE icon will appear on your home screen</li>
                  </ol>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800">
                  <strong>Note:</strong> This must be done in Safari browser. Chrome and other browsers don't support this feature on iOS.
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-white px-6 py-4 rounded-xl shadow-sm">
              <p className="text-gray-600">
                <strong>Need help?</strong> Contact your supervisor or IT support for assistance with installation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 border-t border-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Access the PULSE system and start managing your surveys efficiently.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Access System
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* About Column */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Image 
                  src="/headerlogo4k.png" 
                  alt="PULSE" 
                  width={140}
                  height={50}
                  className="h-10 w-auto"
                />
              </div>
              <p className="text-gray-400 mb-4">
                Public Understanding and Local Service Evaluation system for efficient government survey management.
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span>For Official Government Use Only</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/survey" className="hover:text-white transition-colors">
                    Survey
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li>Support: support@pulse.gov</li>
                <li>Admin: admin@pulse.gov</li>
                <li>System Version: 1.0.0</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 PULSE System. All rights reserved. | For Official Government Use Only</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
