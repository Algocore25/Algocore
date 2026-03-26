import React from 'react';
import { FaPython, FaJava, FaJs, FaCuttlefish, FaReact, FaNodeJs, FaDatabase, FaBolt, FaCode, FaGlobe, FaTerminal, FaLaptopCode, FaServer, FaRobot, FaBrain, FaGamepad, FaMobileAlt, FaCube, FaAws } from "react-icons/fa";
import { SiCplusplus, SiC, SiTypescript, SiHtml5, SiCss3, SiGo, SiRust, SiPhp, SiRuby, SiSwift, SiKotlin, SiMysql, SiFirebase, SiDocker, SiAngular, SiVuedotjs } from "react-icons/si";
import { FiCpu, FiLayers, FiCloud, FiMonitor } from "react-icons/fi";

export const COURSE_ICONS = [
    { val: '', label: 'Default (Auto-detect)', icon: FaCuttlefish, color: 'text-gray-400' },
    { val: 'python', label: 'Python', icon: FaPython, color: 'text-[#3776AB]' },
    { val: 'java', label: 'Java', icon: FaJava, color: 'text-[#007396]' },
    { val: 'javascript', label: 'JavaScript', icon: FaJs, color: 'text-[#F7DF1E]' },
    { val: 'typescript', label: 'TypeScript', icon: SiTypescript, color: 'text-[#3178C6]' },
    { val: 'c', label: 'C', icon: SiC, color: 'text-[#555555]' },
    { val: 'cpp', label: 'C++', icon: SiCplusplus, color: 'text-[#00599C]' },
    { val: 'golang', label: 'Go', icon: SiGo, color: 'text-[#00ADD8]' },
    { val: 'rust', label: 'Rust', icon: SiRust, color: 'text-gray-900 dark:text-white' },
    { val: 'php', label: 'PHP', icon: SiPhp, color: 'text-[#777BB4]' },
    { val: 'ruby', label: 'Ruby', icon: SiRuby, color: 'text-[#CC342D]' },
    { val: 'swift', label: 'Swift', icon: SiSwift, color: 'text-[#F05138]' },
    { val: 'kotlin', label: 'Kotlin', icon: SiKotlin, color: 'text-[#7F52FF]' },
    { val: 'html', label: 'HTML5', icon: SiHtml5, color: 'text-[#E34F26]' },
    { val: 'css', label: 'CSS3', icon: SiCss3, color: 'text-[#1572B6]' },
    { val: 'react', label: 'React', icon: FaReact, color: 'text-[#61DAFB]' },
    { val: 'angular', label: 'Angular', icon: SiAngular, color: 'text-[#DD0031]' },
    { val: 'vue', label: 'Vue.js', icon: SiVuedotjs, color: 'text-[#4FC08D]' },
    { val: 'nodejs', label: 'Node.js', icon: FaNodeJs, color: 'text-[#339933]' },
    { val: 'database', label: 'Database / Data', icon: FaDatabase, color: 'text-[#336791]' },
    { val: 'mysql', label: 'MySQL', icon: SiMysql, color: 'text-[#4479A1]' },
    { val: 'firebase', label: 'Firebase', icon: SiFirebase, color: 'text-[#FFCA28]' },
    { val: 'docker', label: 'Docker', icon: SiDocker, color: 'text-[#2496ED]' },
    { val: 'aws', label: 'AWS', icon: FaAws, color: 'text-[#232F3E] dark:text-gray-300' },
    { val: 'bolt', label: 'Lightning / Fast', icon: FaBolt, color: 'text-yellow-500' },
    { val: 'globe', label: 'Web / Network', icon: FaGlobe, color: 'text-green-500' },
    { val: 'server', label: 'Server / Backend', icon: FaServer, color: 'text-gray-600 dark:text-gray-400' },
    { val: 'cloud', label: 'Cloud Computing', icon: FiCloud, color: 'text-sky-500' },
    { val: 'cpu', label: 'Hardware / CPU', icon: FiCpu, color: 'text-emerald-500' },
    { val: 'layers', label: 'Architecture / Stack', icon: FiLayers, color: 'text-amber-500' },
    { val: 'code', label: 'Code / Script', icon: FaCode, color: 'text-blue-500' },
    { val: 'terminal', label: 'Terminal / CLI', icon: FaTerminal, color: 'text-gray-700 dark:text-gray-300' },
    { val: 'laptop', label: 'Development', icon: FaLaptopCode, color: 'text-indigo-500' },
    { val: 'monitor', label: 'Frontend / UI', icon: FiMonitor, color: 'text-rose-500' },
    { val: 'robot', label: 'AI / Automation', icon: FaRobot, color: 'text-orange-500' },
    { val: 'brain', label: 'Machine Learning', icon: FaBrain, color: 'text-pink-500' },
    { val: 'game', label: 'Game Development', icon: FaGamepad, color: 'text-purple-500' },
    { val: 'mobile', label: 'Mobile App', icon: FaMobileAlt, color: 'text-teal-500' },
    { val: 'cube', label: '3D / Blockchain', icon: FaCube, color: 'text-cyan-500' }
];

export const getCourseIcon = (id, sizeClass = "w-12 h-12") => {
    const iconDef = COURSE_ICONS.find(i => i.val === id);
    if (iconDef) {
        const IconComponent = iconDef.icon;
        return <IconComponent className={`${sizeClass} ${iconDef.color}`} />;
    }
    return null;
};

export const getCourseIconDef = (id) => {
    return COURSE_ICONS.find(i => i.val === id) || COURSE_ICONS[0];
};
