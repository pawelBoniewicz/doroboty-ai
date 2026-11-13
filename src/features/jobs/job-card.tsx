import { Link } from "react-router";
import { ArrowUpRight, Bookmark, MapPin, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrototype } from "@/features/prototype/store";
import type { JobWithCompany } from "./types";
import { categoryLabels, functionLabels, remoteLabels, seniorityLabels } from "./presentation";
import { CompanyLogo } from "./company-logo";
import { SalaryFact } from "./salary-fact";
import posthog from "posthog-js";
export function JobCard({ job, saved }: { job: JobWithCompany; saved?: boolean }) {
  const { run } = usePrototype();
  return (
    <article className="pp-job-card">
      <CompanyLogo company={job.company} />
      <div className="pp-job-main">
        <div className="pp-job-topline">
          <Link className="pp-job-company" to={`/firmy/${job.company.slug}`}>
            {job.company.name}
          </Link>
          <span className="pp-separator">/</span>
          <span className="pp-job-category">{categoryLabels[job.category]}</span>
        </div>
        <h3 className="pp-job-title">
          <Link to={`/oferty/${job.slug}`}>{job.title}</Link>
        </h3>
        <div className="pp-job-facts">
          <span>
            <MapPin className="pp-icon" />
            {job.locations.join(" / ")}
          </span>
          <span>
            <Monitor className="pp-icon" />
            {remoteLabels[job.remoteStatus]}
          </span>
          <span>{seniorityLabels[job.seniority]}</span>
        </div>
        <div className="pp-job-tags">
          <span>{functionLabels[job.function]}</span>
        </div>
      </div>
      <div className="pp-job-side">
        <div className="pp-job-side-top">
          <span className="pp-job-age">
            {new Intl.DateTimeFormat("pl-PL").format(new Date(job.publishedAt))}
          </span>
          {saved !== undefined && (
            <Button
              className="pp-save-button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Zapisz ofertę: ${job.title}`}
              aria-pressed={saved}
              onClick={() => {
                if (run({ type: "toggle_saved", jobId: job.id }) && posthog.__loaded) {
                  try {
                    posthog.capture("job_save_toggled", {
                      job_id: job.id,
                      job_category: job.category,
                      saved: !saved,
                    });
                  } catch {
                    // Analytics must not interrupt the prototype workflow.
                  }
                }
              }}
            >
              <Bookmark className="pp-icon" />
            </Button>
          )}
        </div>
        <SalaryFact job={job} />
        <Link className="pp-detail-button" to={`/oferty/${job.slug}`}>
          Zobacz rolę <ArrowUpRight className="pp-icon" />
        </Link>
      </div>
    </article>
  );
}
