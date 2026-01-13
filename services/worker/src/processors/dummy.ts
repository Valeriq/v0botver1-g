export async function processDummyJob(job: any) {
  console.log("[processor:dummy] Processing job:", job)

  // Simulate work
  await new Promise((resolve) => setTimeout(resolve, 1000))

  console.log("[processor:dummy] Job completed:", job.id)
}
