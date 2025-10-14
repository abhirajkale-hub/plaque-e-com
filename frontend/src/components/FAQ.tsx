import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "What material are your acrylic awards made from?",
      answer: "Our awards are crafted from premium 25mm clear acrylic, ensuring durability and a high-quality finish that lasts for years."
    },
    {
      question: "How long does shipping take?",
      answer: "For India, delivery typically takes 5-7 days. International orders take 10–15 business days."
    },
    {
      question: "Can I customize the design of my award?",
      answer: "Simply select your preferred award design and upload your certificate in high quality. We will print it professionally and deliver it to you."
    },
    {
      question: "What sizes are available?",
      answer: "We offer multiple size options for our acrylic awards. You can view all available sizes on the product pages or in our product builder."
    },
    {
      question: "Do you offer bulk discounts?",
      answer: "Yes, we offer special pricing for bulk orders. Please contact us directly for a custom quote on large quantity orders."
    },
    {
      question: "What is your return policy?",
      answer: "All products are custom-made. Once printed, no cancellations or refunds are possible. If you receive a damaged item, contact us within 24 hours of receiving the order with photos/videos, and we'll arrange a replacement after inspection."
    },
    {
      question: "Can I track my order?",
      answer: "Yes! Once your order ships, you'll receive a tracking number via email. You can also track your order status by logging into your account."
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we ship worldwide! International shipping takes approximately 10–15 business days depending on your location."
    }
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 gradient-text px-2">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg px-4">
            Got questions? We've got answers!
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border/50 rounded-lg px-4 sm:px-6 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors"
            >
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-foreground text-sm sm:text-base pr-2">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm sm:text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
