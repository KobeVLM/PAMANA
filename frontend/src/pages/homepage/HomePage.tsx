import { useNavigate } from 'react-router-dom'
import { Map, Award, BookOpen, ChevronRight, Trophy } from 'lucide-react'

const HomePage = () => {
  const navigate = useNavigate()

  const masteryItems = [
    { id: 1, title: 'Syllable Matching', route: '/mastery/1', bgImage: '/images/Farm.png' },
    { id: 2, title: 'Word Matching', route: '/mastery/2', bgImage: '/images/Garden.png' },
    { id: 3, title: 'Image Matching', route: '/mastery/3', bgImage: '/images/Kitchen.png' },
    { id: 4, title: 'Sentence Creation', route: '/mastery/4', bgImage: '/images/House.png' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* CHALLENGES Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-pamana-green" />
            <h1 className="text-5xl md:text-6xl font-bold text-white font-heading tracking-tight">
              CHALLENGES
            </h1>
          </div>
          <p className="text-green-200 mt-2">
            Test your skills and unlock new levels.
          </p>
        </div>

        {/* 2-Column Layout: Beginner + Mastery - MORE BALANCED */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* LEFT: Beginner - TRAIL MAP (takes 3 columns) */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-3 text-green-300 mb-3">
              <Map className="w-6 h-6 text-pamana-green" />
              <span className="font-semibold text-xl">Beginner</span>
            </div>
            <div 
              className="relative overflow-hidden rounded-2xl p-8 border border-white/10 hover:border-pamana-green/50 hover:shadow-2xl hover:shadow-pamana-green/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer group h-[290px] flex items-center"
              onClick={() => navigate('/trail')}
            >
              {/* Background image */}
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/TrailMap.png')" }} />
              {/* Overlay */}
              <div className="absolute inset-0 bg-green-950/60 group-hover:bg-green-950/40 transition-colors duration-300" />

              {/* Content */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-pamana-green/20 rounded-2xl group-hover:bg-pamana-green/30 group-hover:scale-125 transition-all duration-300">
                    <Map className="w-10 h-10 text-pamana-green group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-2xl group-hover:text-pamana-white group-hover:scale-105 transition-all duration-300">
                      TRAIL MAP
                    </p>
                    <p className="text-green-200/80 text-base mt-1 group-hover:text-green-300 transition-colors duration-300">
                      Start your learning journey
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-7 h-7 text-green-200/60 group-hover:text-pamana-green group-hover:translate-x-3 group-hover:scale-125 transition-all duration-300" />
              </div>
            </div>
          </div>

          {/* RIGHT: Mastery - 4 squares (takes 2 columns) - BIGGER */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 text-green-300 mb-3">
              <Award className="w-6 h-6 text-pamana-green" />
              <span className="font-semibold text-xl">Mastery</span>
            </div>
            <div className="grid grid-cols-2 gap-3 h-[280px]">
              {masteryItems.map((item) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden p-5 rounded-xl border border-white/10 hover:border-pamana-green/60 hover:shadow-xl hover:shadow-pamana-green/20 transition-all duration-300 cursor-pointer text-center flex flex-col items-center justify-center group"
                  onClick={() => navigate(item.route)}
                >
                  {/* Background image */}
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${item.bgImage}')` }} />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-green-950/60 group-hover:bg-green-950/40 transition-colors duration-300" />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <div className="w-14 h-14 rounded-full bg-white/10 group-hover:bg-pamana-green/30 flex items-center justify-center text-xl font-bold text-green-200/80 group-hover:text-white transition-all duration-300">
                      {item.id}
                    </div>
                    <p className="text-sm font-semibold mt-2 text-green-200/80 group-hover:text-white transition-all duration-300">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-10"></div>

        {/* STORY Section */}
        <div>
          <div className="flex items-center gap-3 text-green-300 mb-3">
            <BookOpen className="w-6 h-6 text-pamana-green" />
            <span className="font-semibold text-xl">STORY</span>
          </div>
          <div 
            className="bg-gradient-to-r from-pamana-green/10 to-transparent rounded-2xl p-6 border border-pamana-green/20 hover:border-pamana-green/40 hover:bg-pamana-green/10 hover:shadow-2xl hover:shadow-pamana-green/20 hover:scale-[1.01] transition-all duration-300 cursor-pointer group"
            onClick={() => console.log('Open Story')}
          >
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold text-2xl group-hover:text-pamana-green group-hover:scale-105 transition-all duration-300">
                Pamana Story
              </p>
              <ChevronRight className="w-7 h-7 text-pamana-green group-hover:translate-x-3 group-hover:scale-125 transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Extra spacing at bottom */}
        <div className="h-12"></div>

      </div>
    </div>
  )
}

export default HomePage