import Link from "next/link";

export default function SessionDetailsPage() {
  return (
    <div className="page-shell">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
        <header className="card p-6">
          <p className="pill">One-on-One AI Agent Session</p>
          <h1 className="mt-4 text-3xl font-semibold">
            A focused working session on AI agents for your work or business.
          </h1>
          <p className="mt-3 text-sm text-[#6b5b4e]">
            This is a practical conversation. We will look at your specific
            situation, map what could work, and I will share honest perspectives
            based on what I have built and seen work for others.
          </p>
        </header>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">Who I work with</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-[#6b5b4e]">
            <li>
              Founders and operators who see the potential but do not know where
              to start.
            </li>
            <li>
              Professionals looking to reduce repetitive tasks without losing
              control of quality.
            </li>
            <li>
              Teams exploring voice AI or other agent-based automation for
              customer-facing work.
            </li>
            <li>
              Anyone who has tried tools that did not deliver and wants grounded
              perspective.
            </li>
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">What people tell me</h2>
          <div className="mt-4 space-y-3 text-sm text-[#6b5b4e]">
            <p>
              People appreciate that I actually build this stuff rather than just
              talking about it. They want to know what is real versus hype, and I
              try to be straightforward about both.
            </p>
            <p>
              Many are struggling with too many tools and not enough clarity.
              They want someone who can cut through the noise and focus on what
              moves the needle.
            </p>
            <p>
              Some want to understand if AI agents are worth the investment for
              their specific case. They have heard the promises and want honest
              assessment of tradeoffs.
            </p>
            <p>
              A recurring theme is frustration with half-baked implementations.
              People want to avoid the mistake of building something that looks
              good on paper but does not actually work in practice.
            </p>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">What you take from the session</h2>
          <p className="mt-3 text-sm text-[#6b5b4e]">
            You will leave with a clear direction on how AI agents can fit into
            your work. Not abstract theory, but a practical starting point.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-[#6b5b4e]">
            <li>
              AI trends and updates, with the accounts and sources I follow.
            </li>
            <li>
              Agent strategy (voice AI, workflow automation, or another path) for
              your situation.
            </li>
            <li>
              Build vs. buy guidance on when to build, use tools, or wait.
            </li>
            <li>
              Implementation reality check: what goes wrong and how to avoid it.
            </li>
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">Session details</h2>
          <div className="mt-4 grid gap-4 text-sm text-[#6b5b4e] sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em]">Duration</p>
              <p className="text-base font-semibold text-[#1e1a16]">45 minutes</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em]">Format</p>
              <p className="text-base font-semibold text-[#1e1a16]">Google Meet</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em]">Recording</p>
              <p className="text-base font-semibold text-[#1e1a16]">
                ₹200 (optional, yours to keep)
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em]">Session fee</p>
              <p className="text-base font-semibold text-[#1e1a16]">₹500</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-[#7b6a5f]">
            100% of proceeds go to charity. No NGO claims, just transparent
            accounting.
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/booking" className="btn-primary">
            Book Your Session
          </Link>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
