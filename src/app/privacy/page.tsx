export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Privacy</h1>
      <div className="prose prose-slate mt-6 max-w-none text-slate-700">
        <p>We only collect what we need to run the service:</p>
        <ul>
          <li>Your email and password (or Google account ID) so you can log in.</li>
          <li>The products you add and the ratings you submit.</li>
          <li>Aggregate click data on affiliate links.</li>
        </ul>
        <p>
          Ratings are shown only in aggregate. We never sell your data. Delete your account any time and everything you
          submitted is deleted with it.
        </p>
      </div>
    </div>
  );
}
