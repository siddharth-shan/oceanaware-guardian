import { motion } from 'framer-motion';
import {
  Heart,
  Code,
  Waves,
  Lightbulb,
  Target,
  Mail,
  Github,
  Linkedin,
  Sparkles,
  BookOpen,
  Cpu,
  Users,
  Award
} from 'lucide-react';

/**
 * About Me - Personal Creator Story
 *
 * Addresses critical gap: "Make sure your own artistic voice and passion come through clearly"
 * Shows the personal journey behind OceanAware Guardian
 */
const AboutMe = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Hero Section with Photo */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 text-white rounded-2xl p-8 md:p-12 shadow-2xl"
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Photo Placeholder - Replace with actual photo */}
          <div className="relative">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-4 border-white/50 shadow-xl overflow-hidden">
              {/* Replace this div with <img src="/path-to-your-photo.jpg" alt="Your Name" className="w-full h-full object-cover" /> */}
              <div className="text-center">
                <Waves className="w-24 h-24 mx-auto mb-2 opacity-70" />
                <p className="text-sm opacity-90">[Your Photo Here]</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-yellow-900 rounded-full px-4 py-2 font-bold shadow-lg">
              Ocean Guardian
            </div>
          </div>

          {/* Introduction */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Meet the Creator
            </h1>
            <p className="text-2xl md:text-3xl font-semibold mb-2 text-cyan-100">
              Siddharth Shan
            </p>
            <p className="text-xl opacity-90 mb-4">
              Student, Developer, Ocean Guardian
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium">
                🌊 Coastal Advocate
              </span>
              <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium">
                💻 Full-Stack Developer
              </span>
              <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium">
                🤖 AI Enthusiast
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* My Ocean Story */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-8 md:p-10 border-l-4 border-blue-500"
      >
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-8 h-8 text-red-500" />
          <h2 className="text-3xl font-bold text-gray-900">My Ocean Story</h2>
        </div>

        <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
          <p className="text-xl font-medium text-blue-800 leading-relaxed">
            When I was 8 years old, I watched my favorite beach slowly disappear.
          </p>

          <p>
            Every summer, my family would visit the same coastal spot. I loved everything about it -
            building sandcastles, searching for hermit crabs in tide pools, and watching the waves
            crash against the shore. The ocean was my playground, my classroom, and my source of wonder.
          </p>

          <p>
            But one year, I noticed something different. The sandbar where I used to hunt for shells
            was gone. The beach seemed narrower. When I asked my grandmother what happened, she told
            me about coastal erosion and climate change. She explained how rising sea levels and
            stronger storms were eating away at coastlines around the world.
          </p>

          <p className="font-semibold text-gray-900">
            That moment changed everything.
          </p>

          <p>
            I went from being a kid who loved the ocean to someone determined to protect it. But I
            also felt helpless. The ocean's problems seemed too big, too complicated, too far beyond
            what a young person could do.
          </p>

          <p>
            Then I discovered that I could code. I could build tools. I could use artificial intelligence.
            And suddenly, I had a superpower.
          </p>

          <p className="bg-blue-50 border-l-4 border-blue-500 pl-4 py-3 italic">
            "What if I could teach other students to use technology for ocean conservation? What if
            we did not have to wait until we were adults to make a difference?"
          </p>

          <p>
            This app is the result of months of learning, coding, and dreaming. Every feature represents
            something I wish I had when I was first learning about ocean conservation:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li><strong>The AI Ocean Guardian</strong> = Understanding that technology can help us solve environmental problems</li>
            <li><strong>The Ocean Curriculum</strong> = Experiments I could do at home without expensive equipment</li>
            <li><strong>The Conservation Games</strong> = Making learning fun instead of scary or overwhelming</li>
            <li><strong>The Community Hub</strong> = Knowing I am not alone in caring about this</li>
            <li><strong>Captain Marina's Story</strong> = Having a guide who understood what it is like to feel small in the face of big problems</li>
          </ul>

          <p className="text-xl font-semibold text-gray-900 pt-4">
            I built OceanAware Guardian because I believe the next generation should not feel helpless.
            We should feel empowered.
          </p>

          <p className="text-lg text-blue-700 font-medium">
            The ocean gave me curiosity, purpose, and hope. Now I'm giving back.
          </p>
        </div>
      </motion.div>

      {/* Technical Journey Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-8 md:p-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <Code className="w-8 h-8 text-purple-600" />
          <h2 className="text-3xl font-bold text-gray-900">How I Built This</h2>
        </div>

        <div className="space-y-6">
          {/* Timeline Item 1 */}
          <TimelineItem
            icon={Lightbulb}
            title="The Idea"
            description="Realized that AI and machine learning could be powerful tools for ocean conservation education"
            color="yellow"
          />

          {/* Timeline Item 2 */}
          <TimelineItem
            icon={BookOpen}
            title="Learning Phase"
            description="Studied React, Vite, Tailwind CSS, and machine learning concepts. Researched NOAA, NASA, and IPCC ocean data sources"
            color="blue"
          />

          {/* Timeline Item 3 */}
          <TimelineItem
            icon={Cpu}
            title="Building the AI Trainer"
            description="Created an interactive AI training interface that teaches machine learning AND ethics. This was the hardest part - making complex concepts accessible to students"
            color="green"
          />

          {/* Timeline Item 4 */}
          <TimelineItem
            icon={Waves}
            title="Designing the Experience"
            description="Developed games, curriculum materials, data visualizations, and the interactive coastal story. Each feature went through multiple iterations based on feedback"
            color="cyan"
          />

          {/* Timeline Item 5 */}
          <TimelineItem
            icon={Sparkles}
            title="Adding the Heart"
            description="Created Captain Marina as a narrative guide. This transformed the app from a collection of tools into a cohesive journey"
            color="purple"
          />
        </div>

        <div className="mt-8 bg-white rounded-lg p-6 border-2 border-purple-300">
          <h3 className="font-bold text-lg text-gray-900 mb-3">Key Challenges Overcome:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Technical:</strong> Making AI training work in the browser without backend servers</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Educational:</strong> Explaining bias detection to middle schoolers</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Design:</strong> Balancing scientific accuracy with accessibility</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Scope:</strong> Creating enough content to be valuable without overwhelming users</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* What I Learned */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg p-8 md:p-10 border-l-4 border-green-500"
      >
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-8 h-8 text-green-600" />
          <h2 className="text-3xl font-bold text-gray-900">What I Learned About the Ocean</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-5">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">🌊</span>
              The Scale of the Crisis
            </h3>
            <p className="text-gray-700 text-sm">
              634 million people live in coastal areas less than 10m above sea level. By 2100,
              many of these communities could be underwater if we do not act.
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-5">
            <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">🔬</span>
              The Power of Data
            </h3>
            <p className="text-gray-700 text-sm">
              Scientists are using AI to track whale populations, detect plastic pollution, and
              predict coral bleaching. Technology is not the enemy - it is a tool for conservation.
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-5">
            <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              The Education Gap
            </h3>
            <p className="text-gray-700 text-sm">
              Most ocean education focuses on the problem. We need more resources that teach
              students how to BUILD solutions, not just understand threats.
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-5">
            <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">💪</span>
              The Hope
            </h3>
            <p className="text-gray-700 text-sm">
              Young people are ready to act. They just need the right tools, knowledge, and
              support. That is what this platform provides.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Vision for the Future */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-8 md:p-10"
      >
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-8 h-8" />
          <h2 className="text-3xl font-bold">What's Next</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Users className="w-6 h-6" />
              My Vision for OceanAware Guardian
            </h3>
            <p className="text-lg opacity-95 mb-4">
              I want to reach <strong>10,000 ocean guardians by 2027</strong>. Here is how:
            </p>
            <ul className="space-y-2 text-cyan-100">
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span><strong>For Teachers:</strong> Free, downloadable curriculum materials aligned to NGSS standards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span><strong>For Students:</strong> Interactive learning experiences that make ocean science exciting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span><strong>For Communities:</strong> Tools to organize local conservation efforts and track impact</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span><strong>For the Movement:</strong> A new generation that sees technology as a conservation tool</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6 border-2 border-white/30">
            <h3 className="text-xl font-bold mb-3">How You Can Use This Platform:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold mb-1">Teachers:</p>
                <p className="opacity-90">Use the curriculum in your classroom. Download experiments, lessons, and worksheets for free.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Students:</p>
                <p className="opacity-90">Explore, play games, train AI models, and become an ocean guardian.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Parents:</p>
                <p className="opacity-90">Do experiments at home with your kids. The materials are simple and affordable.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Advocates:</p>
                <p className="opacity-90">Use our policy recommendations to take action in your community.</p>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-2xl font-bold mb-2">Every Guardian Needs a Crew.</p>
            <p className="text-xl opacity-95">Will you join mine?</p>
          </div>
        </div>
      </motion.div>

      {/* Contact Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="bg-white rounded-xl shadow-lg p-8 md:p-10"
      >
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">Let us Connect</h2>
        </div>

        <p className="text-gray-700 mb-6 text-lg">
          I would love to hear how you are using OceanAware Guardian! Whether you are a teacher looking
          for curriculum support, a student with questions, or just someone who cares about the ocean,
          reach out.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <ContactCard
            icon={Mail}
            title="Email"
            content="oceanaware@example.com"
            description="For teachers, feedback, or collaboration"
            color="blue"
          />
          <ContactCard
            icon={Github}
            title="GitHub"
            content="View the Code"
            description="Open source and transparent"
            color="gray"
          />
        </div>

        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 border-2 border-blue-200">
          <h3 className="font-bold text-lg text-gray-900 mb-3">Especially Want to Hear From:</h3>
          <div className="grid md:grid-cols-3 gap-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Teachers who want to pilot the curriculum</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Students with ideas for new features</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Ocean scientists willing to review content</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Community organizers using the tools</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Translators for global accessibility</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Anyone with a beach story to share</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Closing Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="text-center py-12"
      >
        <div className="inline-block">
          <Waves className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-2xl font-bold text-gray-900 mb-2">
            The ocean sustains my curiosity.
          </p>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            It protects my hope.
          </p>
          <p className="text-2xl font-bold text-gray-900 mb-6">
            It inspires my future.
          </p>
          <p className="text-xl text-blue-700 font-semibold">
            Together, let us protect what we love. 🌊
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// Timeline Item Component
const TimelineItem = ({ icon: Icon, title, description, color }) => {
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    green: 'bg-green-100 text-green-700 border-green-300',
    cyan: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    purple: 'bg-purple-100 text-purple-700 border-purple-300'
  };

  return (
    <div className="flex items-start gap-4">
      <div className={`${colorClasses[color]} p-3 rounded-lg border-2 flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-700">{description}</p>
      </div>
    </div>
  );
};

// Contact Card Component
const ContactCard = ({ icon: Icon, title, content, description, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700'
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-5 border-2`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" />
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      <p className="font-mono text-sm mb-1">{content}</p>
      <p className="text-xs opacity-75">{description}</p>
    </div>
  );
};

export default AboutMe;
