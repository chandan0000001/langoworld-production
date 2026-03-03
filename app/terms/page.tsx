"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
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
                    Terms of Service
                </h1>
                <p className="font-[family-name:var(--font-inter)] text-sm text-zinc-400 mb-12">
                    Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
                </p>

                <div className="prose prose-zinc max-w-none font-[family-name:var(--font-inter)]">
                    {/* Introduction */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">1. Introduction</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            Welcome to LangoWorld. These Terms of Service ("Terms") govern your access to and use of the LangoWorld platform, including our website, applications, and services (collectively, the "Service"). LangoWorld provides AI-powered translation, summarization, dubbing, and text-to-speech services.
                        </p>
                        <p className="text-zinc-600 leading-relaxed">
                            By accessing or using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
                        </p>
                    </section>

                    {/* Acceptance */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">2. Acceptance of Terms</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            By creating an account, accessing, or using LangoWorld, you confirm that you are at least 13 years of age and have the legal capacity to enter into these Terms. If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
                        </p>
                        <p className="text-zinc-600 leading-relaxed">
                            We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on our website with a revised "Last updated" date. Your continued use of the Service after such modifications constitutes your acceptance of the updated Terms.
                        </p>
                    </section>

                    {/* User Accounts */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">3. User Accounts</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            To access certain features of the Service, you must create an account using your email address or through third-party authentication providers such as Google or GitHub. You are responsible for:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2 mb-4">
                            <li>Maintaining the confidentiality of your account credentials</li>
                            <li>All activities that occur under your account</li>
                            <li>Providing accurate and complete information during registration</li>
                            <li>Notifying us immediately of any unauthorized access to your account</li>
                        </ul>
                        <p className="text-zinc-600 leading-relaxed">
                            We reserve the right to suspend or terminate your account if we suspect any unauthorized use or violation of these Terms.
                        </p>
                    </section>

                    {/* Prohibited Use */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">4. Prohibited Use</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            You agree not to use the Service for any unlawful purpose or in any way that violates these Terms. Prohibited activities include, but are not limited to:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2">
                            <li>Uploading content that infringes on intellectual property rights of others</li>
                            <li>Generating or distributing harmful, abusive, harassing, or discriminatory content</li>
                            <li>Attempting to reverse engineer, decompile, or extract source code from the Service</li>
                            <li>Using automated systems or bots to access the Service without our permission</li>
                            <li>Circumventing any security measures or access restrictions</li>
                            <li>Reselling or redistributing the Service without authorization</li>
                            <li>Using the Service to generate spam, phishing content, or malware</li>
                            <li>Impersonating any person or entity, or misrepresenting your affiliation</li>
                        </ul>
                    </section>

                    {/* Intellectual Property */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">5. Intellectual Property</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            The Service, including its original content, features, and functionality, is owned by LangoWorld and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                        </p>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            You retain ownership of any content you upload to the Service. By uploading content, you grant LangoWorld a non-exclusive, worldwide, royalty-free license to use, process, and display your content solely for the purpose of providing the Service to you.
                        </p>
                        <p className="text-zinc-600 leading-relaxed">
                            You represent and warrant that you own or have the necessary rights to all content you upload, and that such content does not infringe on the intellectual property rights of any third party.
                        </p>
                    </section>

                    {/* AI Content Disclaimer */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">6. AI-Generated Content Disclaimer</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            LangoWorld uses artificial intelligence and machine learning technologies to provide translation, summarization, and other services. You acknowledge and agree that:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2 mb-4">
                            <li>AI-generated content may not always be accurate, complete, or error-free</li>
                            <li>Translations and summaries are provided for informational purposes and should not be relied upon for legal, medical, financial, or other critical decisions</li>
                            <li>You are responsible for reviewing and verifying any AI-generated content before use</li>
                            <li>LangoWorld does not guarantee the quality, accuracy, or suitability of AI-generated outputs</li>
                        </ul>
                        <p className="text-zinc-600 leading-relaxed">
                            We continuously work to improve our AI systems, but due to the inherent nature of machine learning, outputs may vary and contain errors or inaccuracies.
                        </p>
                    </section>

                    {/* Limitation of Liability */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">7. Limitation of Liability</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LANGOWORLD AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2 mb-4">
                            <li>Loss of profits, data, or business opportunities</li>
                            <li>Damages arising from reliance on AI-generated content</li>
                            <li>Service interruptions or downtime</li>
                            <li>Unauthorized access to or alteration of your data</li>
                        </ul>
                        <p className="text-zinc-600 leading-relaxed">
                            In no event shall our total liability exceed the amount you paid to LangoWorld, if any, in the twelve (12) months preceding the claim.
                        </p>
                    </section>

                    {/* Termination */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">8. Termination</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including but not limited to breach of these Terms.
                        </p>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            You may terminate your account at any time by contacting us or using the account deletion feature in your settings. Upon termination:
                        </p>
                        <ul className="list-disc list-inside text-zinc-600 space-y-2">
                            <li>Your right to access and use the Service will immediately cease</li>
                            <li>We may delete your account data in accordance with our Privacy Policy</li>
                            <li>Provisions that by their nature should survive termination shall survive</li>
                        </ul>
                    </section>

                    {/* Governing Law */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">9. Governing Law</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
                        </p>
                        <p className="text-zinc-600 leading-relaxed">
                            Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts located in India. You agree to submit to the personal jurisdiction of such courts and waive any objections based on venue or inconvenient forum.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">10. Contact Us</h2>
                        <p className="text-zinc-600 leading-relaxed mb-4">
                            If you have any questions about these Terms of Service, please contact us at:
                        </p>
                        <p className="text-zinc-900 font-medium">
                            Email: <a href="mailto:support@langoworld.app" className="text-orange-600 hover:text-orange-700 transition-colors">support@langoworld.app</a>
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
