begin;

drop table if exists private.authenticated_api_test_tokens;
drop table if exists private.authenticated_api_test_results;
delete from cron.job_run_details where jobid in (2,3);
drop extension if exists http;

commit;
