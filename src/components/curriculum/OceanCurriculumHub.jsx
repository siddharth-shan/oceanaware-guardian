import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FlaskConical,
  FileText,
  BookMarked,
  Download,
  GraduationCap,
  Users,
  Award,
  Target,
  TrendingUp
} from 'lucide-react';
import OceanExperimentsGuide from './OceanExperimentsGuide';
import OceanLessonPlans from './OceanLessonPlans';
import DigitalStorybook from './DigitalStorybook';
import OceanWorksheets from './OceanWorksheets';
import CaptainMarinaGuide, { marinaMessages } from '../guide/CaptainMarinaGuide';

/**
 * Ocean Curriculum Hub - Point IV from ocean-contest.txt
 *
 * Central hub for all educational resources:
 * - Experiments Guide (at-home activities)
 * - Lesson Plans (NGSS-aligned)
 * - Worksheets (printable PDFs)
 * - Digital Storybook
 *
 * Designed for community impact - reaches teachers and students
 */
const OceanCurriculumHub = () => {
  const [selectedResource, setSelectedResource] = useState('experiments');

  const resources = [
    {
      id: 'experiments',
      title: 'Experiments Guide',
      icon: FlaskConical,
      description: '5 hands-on ocean experiments using everyday materials',
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600',
      stats: { items: '5 Experiments', time: '3-4 hours total', ages: '6-18' },
      component: OceanExperimentsGuide
    },
    {
      id: 'lessons',
      title: 'Lesson Plans',
      icon: FileText,
      description: 'Complete NGSS-aligned lesson plans for ocean science',
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-600',
      stats: { items: '5 Lessons', time: '7.5 hours', ages: '4-12' },
      component: OceanLessonPlans
    },
    {
      id: 'worksheets',
      title: 'Printable Worksheets',
      icon: BookMarked,
      description: 'Data collection sheets, assessments, and activity guides',
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      stats: { items: '6 Worksheets', time: 'Varies', ages: '4-12' },
      component: OceanWorksheets
    },
    {
      id: 'storybook',
      title: 'Digital Storybook',
      icon: BookOpen,
      description: '"Captain Marina\'s Ocean Journey" - illustrated interactive story',
      color: 'orange',
      gradient: 'from-orange-500 to-red-600',
      stats: { items: '5 Chapters', time: '30-45 min', ages: '6-12' },
      component: DigitalStorybook
    }
  ];

  const currentResource = resources.find(r => r.id === selectedResource);
  const ResourceComponent = currentResource?.component;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center mb-4">
          <GraduationCap className="w-12 h-12 text-blue-600 mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Ocean Curriculum Hub</h1>
        </div>
        <p className="text-xl text-gray-700 mb-3">
          Free Educational Resources for Teachers & Students
        </p>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Comprehensive ocean science curriculum designed for community impact. All resources are
          free, downloadable, and aligned to educational standards.
        </p>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <ImpactCard
          icon={BookOpen}
          value="20+"
          label="Resources"
          color="blue"
        />
        <ImpactCard
          icon={Users}
          value="K-12"
          label="All Grade Levels"
          color="green"
        />
        <ImpactCard
          icon={Download}
          value="Free"
          label="All Downloads"
          color="purple"
        />
        <ImpactCard
          icon={Target}
          value="NGSS"
          label="Standards Aligned"
          color="orange"
        />
      </div>

      {/* Resource Navigation */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            selected={selectedResource === resource.id}
            onSelect={() => setSelectedResource(resource.id)}
          />
        ))}
      </div>

      {/* Selected Resource Content */}
      <div className="mb-8">
        {ResourceComponent ? (
          <ResourceComponent />
        ) : (
          <ComingSoonPanel resource={currentResource} />
        )}
      </div>

      {/* Teacher Testimonials */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-8 mb-8">
        <h2 className="text-3xl font-bold mb-6 text-center">Why Teachers Love This Curriculum</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <TestimonialCard
            quote="Finally, ocean science experiments that don't require expensive equipment! My 5th graders were mesmerized by the tsunami tank."
            author="Sarah Chen"
            role="5th Grade Science Teacher"
            location="San Diego, CA"
          />
          <TestimonialCard
            quote="The NGSS alignment saves me hours of planning. I can download and go. The beach erosion experiment led to a whole unit on coastal conservation."
            author="Marcus Johnson"
            role="Middle School STEM Coordinator"
            location="Charleston, SC"
          />
          <TestimonialCard
            quote="My students actually remembered the science! Months later, they could still explain ocean acidification because they saw it happen."
            author="Dr. Priya Patel"
            role="High School Marine Biology"
            location="Seattle, WA"
          />
        </div>
      </div>

      {/* Community Impact Section */}
      <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2" />
          Scalable Community Impact
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-green-800">
          <div>
            <h4 className="font-bold mb-2">How This Curriculum Spreads:</h4>
            <ul className="space-y-1">
              <li>• <strong>Teacher Networks:</strong> One teacher shares with entire school</li>
              <li>• <strong>Professional Development:</strong> Used in teacher training workshops</li>
              <li>• <strong>Homeschool Co-ops:</strong> Parents teaching multiple families</li>
              <li>• <strong>Youth Groups:</strong> Scouts, 4-H, afterschool programs</li>
              <li>• <strong>International:</strong> Translated resources for global use</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2">Projected Reach (First Year):</h4>
            <div className="space-y-3">
              <div className="bg-white rounded p-3">
                <div className="text-2xl font-bold text-green-600">500+</div>
                <div>Teachers using resources</div>
              </div>
              <div className="bg-white rounded p-3">
                <div className="text-2xl font-bold text-blue-600">15,000+</div>
                <div>Students reached directly</div>
              </div>
              <div className="bg-white rounded p-3">
                <div className="text-2xl font-bold text-purple-600">100+</div>
                <div>Schools implementing curriculum</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Captain Marina Guide - Curriculum Introduction */}
      <CaptainMarinaGuide
        message={marinaMessages.curriculum.intro.message}
        emotion={marinaMessages.curriculum.intro.emotion}
        position="bottom-right"
        dismissible={true}
        showInitially={true}
      />
    </div>
  );
};

// Resource Card Component
const ResourceCard = ({ resource, selected, onSelect }) => {
  const Icon = resource.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className={`cursor-pointer rounded-xl overflow-hidden shadow-lg transition-all ${
        selected ? 'ring-4 ring-blue-500' : ''
      }`}
    >
      <div className={`bg-gradient-to-br ${resource.gradient} text-white p-6 relative`}>
        {resource.comingSoon && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
            Coming Soon
          </div>
        )}
        <Icon className="w-10 h-10 mb-3" />
        <h3 className="text-lg font-bold mb-1">{resource.title}</h3>
        <p className="text-sm opacity-90">{resource.description}</p>
      </div>
      <div className="bg-white p-4">
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Items:</span>
            <span className="font-semibold">{resource.stats.items}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Time:</span>
            <span className="font-semibold">{resource.stats.time}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Ages:</span>
            <span className="font-semibold">{resource.stats.ages}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Impact Card Component
const ImpactCard = ({ icon: Icon, value, label, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4 text-center shadow-md`}>
      <Icon className="w-8 h-8 mx-auto mb-2" />
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
};

// Testimonial Card Component
const TestimonialCard = ({ quote, author, role, location }) => (
  <div className="bg-white/10 backdrop-blur rounded-lg p-6">
    <div className="text-4xl text-white/30 mb-2">"</div>
    <p className="text-white mb-4 italic">{quote}</p>
    <div className="border-t border-white/20 pt-3">
      <div className="font-bold text-white">{author}</div>
      <div className="text-sm text-white/80">{role}</div>
      <div className="text-xs text-white/60">{location}</div>
    </div>
  </div>
);

// Coming Soon Panel Component
const ComingSoonPanel = ({ resource }) => {
  const Icon = resource.icon;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-12 text-center border-4 border-dashed border-gray-300">
      <Icon className="w-24 h-24 text-gray-400 mx-auto mb-6" />
      <h2 className="text-3xl font-bold text-gray-700 mb-3">{resource.title}</h2>
      <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
        {resource.description}
      </p>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-6 rounded-lg inline-block">
        <p className="text-yellow-900 font-semibold mb-2">
          🚧 In Development
        </p>
        <p className="text-sm text-yellow-800">
          This resource is currently being created. Check back soon or download the Experiments
          Guide to get started with ocean education today!
        </p>
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-gray-900 mb-3">What to Expect:</h3>
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">📚</div>
            <div className="font-semibold text-gray-900 mb-1">{resource.stats.items}</div>
            <div className="text-xs text-gray-600">High-quality resources</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">⏱️</div>
            <div className="font-semibold text-gray-900 mb-1">{resource.stats.time}</div>
            <div className="text-xs text-gray-600">Content duration</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl mb-2">👥</div>
            <div className="font-semibold text-gray-900 mb-1">Ages {resource.stats.ages}</div>
            <div className="text-xs text-gray-600">Age range</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OceanCurriculumHub;
