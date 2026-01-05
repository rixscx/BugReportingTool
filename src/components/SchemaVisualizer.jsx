import React from 'react'

export default function SchemaVisualizer() {
    return (
        <div className="relative bg-[rgba(12,12,18,0.7)] backdrop-blur-xl rounded-2xl border border-[rgba(255,255,255,0.06)] p-8 overflow-hidden min-h-[500px] font-mono text-[11px]">
            {/* Ambient background orbs */}
            <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-[rgba(99,102,241,0.05)] blur-[80px] pointer-events-none" />
            <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-[rgba(139,92,246,0.05)] blur-[60px] pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 max-w-4xl mx-auto">

                <div className="group border border-[rgba(255,255,255,0.08)] bg-[rgba(12,12,18,0.8)] backdrop-blur-xl rounded-2xl md:col-start-1 md:row-start-1 overflow-hidden hover:border-[rgba(99,102,241,0.3)] transition-all duration-300">
                    <div className="bg-[rgba(20,20,28,0.8)] px-4 py-3 border-b border-[rgba(255,255,255,0.06)] text-[#f0f0f5] font-semibold flex justify-between items-center">
                        <span>profiles</span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between"><span className="text-[#818cf8]">id</span> <span className="text-[#4a4a58]">uuid PK</span></div>
                        <div className="flex justify-between"><span className="text-[#9898a8]">username</span> <span className="text-[#4a4a58]">text</span></div>
                        <div className="flex justify-between"><span className="text-[#9898a8]">email</span> <span className="text-[#4a4a58]">text</span></div>
                        <div className="flex justify-between"><span className="text-[#9898a8]">avatar_url</span> <span className="text-[#4a4a58]">text</span></div>
                        <div className="flex justify-between"><span className="text-[#9898a8]">role</span> <span className="text-[#4a4a58]">text</span></div>
                    </div>
                </div>

                <div className="group border border-[rgba(255,255,255,0.08)] bg-[rgba(12,12,18,0.8)] backdrop-blur-xl rounded-2xl md:col-start-2 md:row-start-1 mt-8 md:mt-0 relative overflow-hidden hover:border-[rgba(99,102,241,0.3)] transition-all duration-300">
                    <div className="bg-[rgba(20,20,28,0.8)] px-4 py-3 border-b border-[rgba(255,255,255,0.06)] text-[#f0f0f5] font-semibold flex justify-between items-center">
                        <span>bugs</span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between"><span className="text-[#818cf8]">id</span> <span className="text-[#4a4a58]">uuid PK</span></div>
                        <div className="flex justify-between"><span className="text-[#fbbf24]">reported_by</span> <span className="text-[#4a4a58]">uuid FK</span></div>
                        <div className="flex justify-between"><span className="text-[#9898a8]">title</span> <span className="text-[#4a4a58]">text</span></div>
                        <div className="flex justify-between"><span className="text-[#9898a8]">status</span> <span className="text-[#4a4a58]">text</span></div>
                        <div className="flex justify-between"><span className="text-[#9898a8]">priority</span> <span className="text-[#4a4a58]">text</span></div>
                        <div className="flex justify-between"><span className="text-[#9898a8]">is_archived</span> <span className="text-[#4a4a58]">bool</span></div>
                    </div>
                </div>

                <div className="group border border-[rgba(255,255,255,0.08)] bg-[rgba(12,12,18,0.8)] backdrop-blur-xl rounded-2xl md:col-start-3 md:row-start-1 mt-8 md:mt-16 relative overflow-hidden hover:border-[rgba(99,102,241,0.3)] transition-all duration-300">
                    <div className="bg-[rgba(20,20,28,0.8)] px-4 py-3 border-b border-[rgba(255,255,255,0.06)] text-[#f0f0f5] font-semibold flex justify-between items-center">
                        <span>comments</span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between"><span className="text-[#818cf8]">id</span> <span className="text-[#4a4a58]">uuid PK</span></div>
                        <div className="flex justify-between"><span className="text-[#fbbf24]">bug_id</span> <span className="text-[#4a4a58]">uuid FK</span></div>
                        <div className="flex justify-between"><span className="text-[#fbbf24]">author_id</span> <span className="text-[#4a4a58]">uuid FK</span></div>
                        <div className="flex justify-between"><span className="text-[#9898a8]">content</span> <span className="text-[#4a4a58]">text</span></div>
                    </div>
                </div>

                <div className="group border border-[rgba(255,255,255,0.08)] bg-[rgba(12,12,18,0.8)] backdrop-blur-xl rounded-2xl md:col-start-2 md:col-span-1 md:row-start-2 mt-6 relative overflow-hidden hover:border-[rgba(99,102,241,0.3)] transition-all duration-300">
                    <div className="bg-[rgba(20,20,28,0.8)] px-4 py-3 border-b border-[rgba(255,255,255,0.06)] text-[#f0f0f5] font-semibold flex justify-between items-center">
                        <span>activity_logs</span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between"><span className="text-[#818cf8]">id</span> <span className="text-[#4a4a58]">uuid PK</span></div>
                        <div className="flex justify-between"><span className="text-[#fbbf24]">actor_id</span> <span className="text-[#4a4a58]">uuid FK</span></div>
                        <div className="flex justify-between"><span className="text-[#9898a8]">entity_type</span> <span className="text-[#4a4a58]">text</span></div>
                        <div className="flex justify-between"><span className="text-[#fbbf24]">entity_id</span> <span className="text-[#4a4a58]">uuid</span></div>
                        <div className="flex justify-between"><span className="text-[#9898a8]">action</span> <span className="text-[#4a4a58]">enum</span></div>
                        <div className="flex justify-between"><span className="text-[#9898a8]">metadata</span> <span className="text-[#4a4a58]">jsonb</span></div>
                    </div>
                </div>

            </div>

            <div className="absolute bottom-4 right-4 text-[10px] text-[#35354a] text-right">
                <p>Schema visualization</p>
            </div>
        </div>
    )
}
