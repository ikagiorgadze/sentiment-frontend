import { Sparkles, ShieldCheck, Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChatPanel } from '@/components/chat/ChatPanel';

const focusAreas = [
  'Elections & coalitions',
  'Democratization & erosion risks',
  'Foreign policy pivots',
  'Social movements',
  'Comparative institutions',
];

const guarantees = [
  {
    title: 'Evidence based',
    description: 'Answers synthesize recent reporting with scholarly research so you can cite both sources.',
    icon: ShieldCheck,
  },
  {
    title: 'Current context',
    description: 'Each response refreshes the latest developments before crafting analysis.',
    icon: Clock3,
  },
];

export default function Chat() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b-2 border-slate-900 bg-white px-8 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
          Political Science Intelligence
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-black">AI Research Assistant</h1>
          <Badge variant="secondary" className="bg-slate-100 text-slate-900">
            Live beta
          </Badge>
        </div>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Ask in-depth questions about elections, democratization, institutional change, policy decisions, or key
          political actors. The assistant blends current reporting, comparative research, and academic references so you
          can brief teams faster.
        </p>
      </div>

      <div className="space-y-8 px-8 py-10">
        <Card className="border-2 border-slate-900 shadow-lg">
          <CardHeader className="border-b border-slate-200 bg-slate-50">
            <CardTitle className="text-2xl font-semibold text-slate-900">What to ask</CardTitle>
            <CardDescription className="text-base text-slate-600">
              Include geography, institutions, timelines, and actors for precise answers.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6 text-slate-600">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
              <li>Compare democratic backsliding indicators between two countries.</li>
              <li>Summarize coalition negotiations with timelines and cite credible sources.</li>
              <li>Explain historical precedents for a new electoral reform or protest movement.</li>
              <li>Request theory-backed strategies for civil society, opposition parties, or observers.</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              {focusAreas.map((area) => (
                <Badge key={area} variant="outline" className="rounded-full border-slate-300 text-xs font-medium">
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
          <Card className="border-2 border-slate-900 shadow-xl">
            <CardHeader className="border-b border-slate-200 bg-slate-50">
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                <Sparkles className="h-5 w-5 text-slate-900" />
                Start a conversation
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Responses arrive in ~20 seconds and include citations plus strategic context.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ChatPanel variant="page" className="p-6" />
            </CardContent>
          </Card>

          <div className="space-y-6">
            {guarantees.map((item) => (
              <Card key={item.title} className="border-2 border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <item.icon className="h-6 w-6 text-slate-900" />
                    <div>
                      <CardTitle className="text-lg text-slate-900">{item.title}</CardTitle>
                      <CardDescription className="text-sm text-slate-600">{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
