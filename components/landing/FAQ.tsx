"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { staggerContainer, fadeInUp } from "@/utils/animations";

const faqs = [
    {
        question: "Can I import my existing member data?",
        answer: "Absolutely. We offer a one-click import tool for Excel and CSV files. Our support team is also available to help migrate data from legacy systems like ShulCloud or Rakefet."
    },
    {
        question: "How does billing work?",
        answer: "You can set up recurring membership dues, building fund pledges, and one-time donations. The system automatically charges cards on file and sends email receipts."
    },
    {
        question: "Is my data secure?",
        answer: "Yes. We use bank-level encryption (AES-256) and never store credit card numbers directly on our servers (we use PCI-compliant tokenization via Cardknox/Stripe)."
    },
    {
        question: "Do you support Hebrew text?",
        answer: "Fully. ShulGenius is built with right-to-left layout support where needed and handles Hebrew names and fields perfectly."
    }
];

export default function FAQ() {
    return (
        <section id="faq" className="py-24 bg-transparent relative z-10">
            <div className="max-w-4xl mx-auto px-6">

                <motion.div
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="space-y-12"
                >
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-bold font-serif text-stone-900">
                            Frequently Asked <span className="text-amber-600">Questions</span>
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <Accordion key={i} {...faq} />
                        ))}
                    </div>
                </motion.div>

            </div>
        </section>
    );
}

function Accordion({ question, answer }: any) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            variants={fadeInUp}
            className="bg-white/60 backdrop-blur-md border border-stone-200/50 rounded-xl overflow-hidden hover:border-amber-200 transition-colors"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left"
            >
                <span className="text-lg font-bold font-serif text-stone-900">{question}</span>
                <span className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-amber-100 text-amber-700' : 'bg-stone-50 text-stone-400'}`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="p-6 pt-0 text-stone-600 leading-relaxed border-t border-stone-50">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
