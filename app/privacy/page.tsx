"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#FAFAF9]">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="font-[family-name:var(--font-inter)] text-4xl sm:text-5xl font-black text-zinc-900 tracking-tight mb-4">
                    Privacy Policy
                </h1>
                <p className="font-[family-name:var(--font-inter)] text-sm text-zinc-400 mb-12">
                    Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
                </p>

                <div className="prose prose-zinc max-w-none font-[family-name:var(--font-inter)]">
                    {/* Introduction */}
                    <section className="mb-10">
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            At LangoWorld, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered translation, summarization, and dubbing services.
                        </p>
                        <p className="text-zinc-600 leading-relaxed">
                            By using LangoWorld, you consent to the data practices described in this policy. If you do not agree with this policy, please do not use our Service.
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">1. Information We Collect</h2>
                        
                        <h3 className="text-lg font-semibold text-zinc-800 mb-3">Account Information</h3>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            When you create an account, we collect:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2 mb-6">
                            <li>Email address</li>
                            <li>Username (if provided)</li>
                            <li>Profile information from OAuth providers (Google, GitHub) including name and profile picture</li>
                            <li>Authentication tokens and session data</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-zinc-800 mb-3">Content and Usage Data</h3>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            When you use our Service, we collect:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2 mb-6">
                            <li>Videos and documents you upload for processing</li>
                            <li>YouTube URLs and video metadata you submit</li>
                            <li>Generated summaries, translations, and transcripts</li>
                            <li>Translation preferences and language settings</li>
                            <li>Audio files generated through text-to-speech</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-zinc-800 mb-3">Technical Information</h3>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            We automatically collect certain technical information:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2">
                            <li>IP address and approximate location</li>
                            <li>Browser type and version</li>
                            <li>Device type and operating system</li>
                            <li>Pages visited and time spent on the Service</li>
                            <li>Referring website or source</li>
                        </ul>
                    </section>

                    {/* How We Use Data */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">2. How We Use Your Data</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            We use the information we collect for the following purposes:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2">
                            <li><strong>Service Delivery:</strong> To provide AI translation, summarization, transcription, and text-to-speech services</li>
                            <li><strong>Account Management:</strong> To create and maintain your account, authenticate your identity, and manage your preferences</li>
                            <li><strong>Improvement:</strong> To analyze usage patterns and improve our AI models and user experience</li>
                            <li><strong>Communication:</strong> To send service-related notifications, updates, and respond to your inquiries</li>
                            <li><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, and security threats</li>
                            <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
                        </ul>
                    </section>

                    {/* Data Retention */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">3. Data Retention</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            We retain your data for as long as necessary to provide you with the Service and fulfill the purposes outlined in this policy:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2">
                            <li><strong>Account Data:</strong> Retained until you delete your account or request deletion</li>
                            <li><strong>Uploaded Content:</strong> Stored for the duration of your account unless you manually delete it</li>
                            <li><strong>Generated Summaries:</strong> Retained in your workspace until deleted by you or upon account termination</li>
                            <li><strong>Usage Logs:</strong> Typically retained for 90 days for security and analytics purposes</li>
                            <li><strong>Backup Data:</strong> May be retained for up to 30 days after deletion for disaster recovery</li>
                        </ul>
                    </section>

                    {/* Third-Party Services */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">4. Third-Party Services</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            We use trusted third-party services to operate LangoWorld. These providers may have access to your data as necessary to perform their functions:
                        </p>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-zinc-50 rounded-xl">
                                <h4 className="font-semibold text-zinc-900 mb-2">Google OAuth</h4>
                                <p className="text-zinc-600 text-sm">Used for authentication. We receive your email, name, and profile picture. Google's Privacy Policy applies to their handling of your data.</p>
                            </div>
                            
                            <div className="p-4 bg-zinc-50 rounded-xl">
                                <h4 className="font-semibold text-zinc-900 mb-2">GitHub OAuth</h4>
                                <p className="text-zinc-600 text-sm">Used for authentication. We receive your email, username, and profile information. GitHub's Privacy Statement applies to their handling of your data.</p>
                            </div>
                            
                            <div className="p-4 bg-zinc-50 rounded-xl">
                                <h4 className="font-semibold text-zinc-900 mb-2">Supabase</h4>
                                <p className="text-zinc-600 text-sm">Provides database, authentication, and storage infrastructure. Your data is stored securely in Supabase-managed databases with encryption at rest.</p>
                            </div>
                            
                            <div className="p-4 bg-zinc-50 rounded-xl">
                                <h4 className="font-semibold text-zinc-900 mb-2">Vercel</h4>
                                <p className="text-zinc-600 text-sm">Hosts our application and provides edge computing. May collect technical logs and analytics data as part of their infrastructure services.</p>
                            </div>
                            
                            <div className="p-4 bg-zinc-50 rounded-xl">
                                <h4 className="font-semibold text-zinc-900 mb-2">Google Gemini AI</h4>
                                <p className="text-zinc-600 text-sm">Powers our AI summarization and text-to-speech features. Content is processed through Google's AI services subject to their data handling policies.</p>
                            </div>
                            
                            <div className="p-4 bg-zinc-50 rounded-xl">
                                <h4 className="font-semibold text-zinc-900 mb-2">Cloudflare R2</h4>
                                <p className="text-zinc-600 text-sm">Provides object storage for uploaded videos and generated audio files with global distribution and encryption.</p>
                            </div>
                        </div>
                    </section>

                    {/* Cookies */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">5. Cookies and Tracking</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            We use cookies and similar tracking technologies to enhance your experience:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2 mb-4">
                            <li><strong>Essential Cookies:</strong> Required for authentication, session management, and core functionality</li>
                            <li><strong>Preference Cookies:</strong> Store your language preferences and theme settings</li>
                            <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our Service</li>
                        </ul>
                        <p className="text-zinc-600 leading-relaxed">
                            You can control cookies through your browser settings. Note that disabling certain cookies may affect the functionality of the Service.
                        </p>
                    </section>

                    {/* Data Deletion Rights */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">6. Your Rights and Data Deletion</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            You have the following rights regarding your personal data:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2 mb-4">
                            <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal data and account</li>
                            <li><strong>Export:</strong> Request an export of your data in a portable format</li>
                            <li><strong>Objection:</strong> Object to certain processing of your data</li>
                        </ul>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            To delete your account and associated data:
                        </p>
                        <ol className="list-decimal list-inside text-zinc-600 space-y-2">
                            <li>Navigate to Settings in your workspace</li>
                            <li>Click on "Delete Account"</li>
                            <li>Confirm deletion by following the prompts</li>
                        </ol>
                        <p className="text-zinc-600 leading-relaxed mt-4">
                            Alternatively, you can email us at <a href="mailto:support@langoworld.app" className="text-orange-600 hover:text-orange-700 transition-colors">support@langoworld.app</a> to request data deletion or exercise any of your rights.
                        </p>
                    </section>

                    {/* Security */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">7. Security Practices</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            We implement industry-standard security measures to protect your data:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2">
                            <li>All data transmitted between your browser and our servers is encrypted using TLS/SSL</li>
                            <li>Passwords are hashed using secure algorithms and never stored in plain text</li>
                            <li>Database access is restricted and monitored</li>
                            <li>Regular security audits and vulnerability assessments</li>
                            <li>OAuth authentication eliminates the need to share passwords with LangoWorld</li>
                            <li>File uploads are scanned and validated before processing</li>
                        </ul>
                        <p className="text-zinc-600 leading-relaxed mt-4">
                            While we strive to protect your data, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security but are committed to promptly addressing any security incidents.
                        </p>
                    </section>

                    {/* Children's Privacy */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">8. Children's Privacy</h2>
                        <p className="text-zinc-600 leading-relaxed">
                            LangoWorld is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at <a href="mailto:support@langoworld.app" className="text-orange-600 hover:text-orange-700 transition-colors">support@langoworld.app</a>, and we will take steps to delete such information.
                        </p>
                    </section>

                    {/* Changes */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">9. Changes to This Policy</h2>
                        <p className="text-zinc-600 leading-relaxed">
                            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website with a revised "Last updated" date. We encourage you to review this policy periodically.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">10. Contact Us</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
                        </p>
                        <p className="text-zinc-900 font-medium">
                            Email: <a href="mailto:support@langoworld.app" className="text-orange-600 hover:text-orange-700 transition-colors">support@langoworld.app</a>
                        </p>
                        <p className="text-zinc-600 leading-relaxed mt-4">
                            We will respond to your inquiry within 30 days.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-200/60 py-8">
                <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="font-[family-name:var(--font-inter)] text-sm text-zinc-400">
                        © {new Date().getFullYear()} LangoWorld. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="/terms" className="font-[family-name:var(--font-inter)] text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Terms</Link>
                        <Link href="/privacy" className="font-[family-name:var(--font-inter)] text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Privacy</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
