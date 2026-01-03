import React from 'react'

export default function SchemaVisualizer() {
    return (
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 overflow-hidden relative min-h-[600px] text-slate-300 font-mono text-xs">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute left-0 top-0 w-full h-full bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10 max-w-5xl mx-auto">

                {/* PROFILES TABLE */}
                <div className="border border-slate-600 bg-slate-800 rounded-lg shadow-xl md:col-start-1 md:row-start-1">
                    <div className="bg-slate-700 px-4 py-2 border-b border-slate-600 font-bold flex justify-between items-center">
                        <span>public.profiles</span>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between"><span className="text-yellow-400">id</span> <span className="text-slate-500">uuid PK</span></div>
                        <div className="flex justify-between"><span>username</span> <span className="text-slate-500">text</span></div>
                        <div className="flex justify-between"><span>email</span> <span className="text-slate-500">text</span></div>
                        <div className="flex justify-between"><span>avatar_url</span> <span className="text-slate-500">text</span></div>
                    </div>
                </div>

                {/* BUGS TABLE */}
                <div className="border border-slate-600 bg-slate-800 rounded-lg shadow-xl md:col-start-2 md:row-start-1 mt-12 md:mt-0 relative group">
                    <div className="absolute -left-6 top-10 w-6 h-[2px] bg-slate-500 hidden md:block"></div>  {/* FK Line */}
                    <div className="bg-slate-700 px-4 py-2 border-b border-slate-600 font-bold flex justify-between items-center">
                        <span>public.bugs</span>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between"><span className="text-yellow-400">id</span> <span className="text-slate-500">uuid PK</span></div>
                        <div className="flex justify-between"><span className="text-blue-400">user_id</span> <span className="text-slate-500">uuid FK</span></div>
                        <div className="flex justify-between"><span>title</span> <span className="text-slate-500">text</span></div>
                        <div className="flex justify-between"><span>status</span> <span className="text-slate-500">text</span></div>
                        <div className="flex justify-between"><span>priority</span> <span className="text-slate-500">text</span></div>
                        <div className="flex justify-between"><span>is_archived</span> <span className="text-slate-500">bool</span></div>
                    </div>
                </div>

                {/* COMMENTS TABLE */}
                <div className="border border-slate-600 bg-slate-800 rounded-lg shadow-xl md:col-start-3 md:row-start-1 mt-12 md:mt-24 relative">
                    <div className="absolute -left-6 top-10 w-6 h-[2px] bg-slate-500 hidden md:block"></div> {/* FK Line */}
                    <div className="bg-slate-700 px-4 py-2 border-b border-slate-600 font-bold flex justify-between items-center">
                        <span>public.comments</span>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between"><span className="text-yellow-400">id</span> <span className="text-slate-500">uuid PK</span></div>
                        <div className="flex justify-between"><span className="text-blue-400">bug_id</span> <span className="text-slate-500">uuid FK</span></div>
                        <div className="flex justify-between"><span className="text-blue-400">user_id</span> <span className="text-slate-500">uuid FK</span></div>
                        <div className="flex justify-between"><span>content</span> <span className="text-slate-500">text</span></div>
                    </div>
                </div>

                {/* ACTIVITY LOGS TABLE (Floating below) */}
                <div className="border border-slate-600 bg-slate-800 rounded-lg shadow-xl md:col-start-2 md:col-span-1 md:row-start-2 mt-8 relative">
                    <div className="absolute left-1/2 -top-8 w-[2px] h-8 bg-slate-500 hidden md:block"></div>
                    <div className="bg-slate-700 px-4 py-2 border-b border-slate-600 font-bold flex justify-between items-center">
                        <span>public.bug_activity</span>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between"><span className="text-yellow-400">id</span> <span className="text-slate-500">uuid PK</span></div>
                        <div className="flex justify-between"><span className="text-blue-400">bug_id</span> <span className="text-slate-500">uuid FK</span></div>
                        <div className="flex justify-between"><span className="text-blue-400">actor_id</span> <span className="text-slate-500">uuid FK</span></div>
                        <div className="flex justify-between"><span>action</span> <span className="text-slate-500">text</span></div>
                        <div className="flex justify-between"><span>metadata</span> <span className="text-slate-500">jsonb</span></div>
                    </div>
                </div>

            </div>

            {/* Connection SVG Overlay using percentage coordinates roughly aligned with grid */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block">
                <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
                    </marker>
                </defs>

                {/* Profiles to Bugs (User -> Bugs) */}
                {/* Drawn implicitly by div borders, but can enhance here if needed */}
            </svg>

            <div className="absolute bottom-4 right-4 text-slate-500 text-xs text-right">
                <p>Interactive Schema Map</p>
                <p>Visualizing foreign key relationships</p>
            </div>
        </div>
    )
}
