import { describe, expect, it, vi } from "vitest";
import { klingActionHandlers } from "./runtime.ts";

async function getVideoWithDuration(duration: unknown): Promise<unknown> {
  const fetcher = vi.fn<typeof fetch>(async () =>
    Response.json({
      code: 0,
      data: [
        {
          id: "task-1",
          status: "succeeded",
          outputs: [{ type: "video", url: "https://example.com/video.mp4", duration }],
        },
      ],
    }),
  );
  const result = await klingActionHandlers.get_video_generation({ taskId: "task-1" }, { apiKey: "test-key", fetcher });
  expect(fetcher).toHaveBeenCalledOnce();
  return result;
}

describe("Kling video duration", () => {
  it("omits a whitespace-only duration from a successful task", async () => {
    await expect(getVideoWithDuration(" \t\n")).resolves.toEqual({
      taskId: "task-1",
      state: "succeeded",
      videoUrl: "https://example.com/video.mp4",
    });
  });

  it("keeps empty duration missing and preserves present numeric durations", async () => {
    const expected = { taskId: "task-1", state: "succeeded", videoUrl: "https://example.com/video.mp4" };
    expect(await getVideoWithDuration("")).toEqual(expected);
    expect(await getVideoWithDuration("0")).toEqual({ ...expected, duration: 0 });
    expect(await getVideoWithDuration(0)).toEqual({ ...expected, duration: 0 });
    expect(await getVideoWithDuration(5.5)).toEqual({ ...expected, duration: 5.5 });
    expect(await getVideoWithDuration(" 5.5 ")).toEqual({ ...expected, duration: 5.5 });
  });
});
