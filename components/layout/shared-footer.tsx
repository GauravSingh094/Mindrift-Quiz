import Link from 'next/link';

export function SharedFooter() {
  return (
    <footer className="relative z-10 py-6 border-t border-gray-800 bg-black/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 text-center">
        <div className="space-y-3">
          <p className="text-sm md:text-base text-gray-400">
            © 2025 Mindrift. All rights reserved. | Developed by <strong className="text-gray-300">Gaurav Singh</strong>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm">
            <a 
              href="https://www.linkedin.com/in/gaurav-singh-276944292?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors underline-offset-4 hover:underline flex items-center gap-1"
            >
              💼 LinkedIn
            </a>
            <span className="hidden sm:inline text-gray-600">&nbsp;|&nbsp;</span>
            <a 
              href="mailto:gauravsinghx2510@gmail.com"
              className="text-gray-400 hover:text-white transition-colors underline-offset-4 hover:underline flex items-center gap-1"
            >
              📧 gauravsinghx2510@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}