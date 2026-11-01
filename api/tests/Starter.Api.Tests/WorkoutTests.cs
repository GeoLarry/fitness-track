using System.Net;
using System.Net.Http.Json;
using Starter.Core.Contracts;
using Starter.Core.Enums;

namespace Starter.Api.Tests;

public class WorkoutTests(StarterApiFactory factory) : IClassFixture<StarterApiFactory>
{
    [Fact]
    public async Task A_workout_is_started_saved_and_completed()
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();
        int benchPress = await ExerciseIdAsync(client, "Bench Press");

        WorkoutResponse started = await CreateAsync(client, WorkoutStatus.InProgress, [new(benchPress, null, [new(false, 60, 8, false)])]);
        Assert.Equal(WorkoutStatus.InProgress, started.Status);
        Assert.NotNull(started.StartedAtUtc);

        SaveWorkoutRequest save = new("Monday", "Felt strong", null, 600,
            [new(benchPress, "Pause on the chest", [new(false, 60, 8, true), new(false, 62.5m, 6, true)])]);
        WorkoutResponse saved = (await (await client.PutAsJsonAsync($"/api/workouts/{started.Id}", save, StarterApiFactory.Json))
            .Content.ReadFromJsonAsync<WorkoutResponse>(StarterApiFactory.Json))!;
        Assert.Equal("Monday", saved.Name);
        Assert.Equal([60m, 62.5m], saved.Exercises.Single().Sets.Select(s => s.WeightKg));
        Assert.Equal("Bench Press", saved.Exercises.Single().ExerciseName);

        HttpResponseMessage complete = await client.PostAsJsonAsync($"/api/workouts/{started.Id}/complete", new CompleteWorkoutRequest(1800), StarterApiFactory.Json);
        Assert.Equal(HttpStatusCode.OK, complete.StatusCode);
        WorkoutResponse completed = (await complete.Content.ReadFromJsonAsync<WorkoutResponse>(StarterApiFactory.Json))!;
        Assert.Equal(WorkoutStatus.Completed, completed.Status);
        Assert.Equal(1800, completed.DurationSeconds);
        Assert.NotNull(completed.CompletedAtUtc);

        List<WorkoutSummaryResponse> history = await ListAsync(client, "?status=Completed");
        WorkoutSummaryResponse summary = Assert.Single(history);
        Assert.Equal(2, summary.SetCount);
        Assert.Equal(60m * 8 + 62.5m * 6, summary.VolumeKg);
        Assert.Equal(HttpStatusCode.NoContent, (await client.GetAsync("/api/workouts/current")).StatusCode);
    }

    [Fact]
    public async Task Completing_without_a_duration_uses_the_start_time()
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();
        WorkoutResponse started = await CreateAsync(client, WorkoutStatus.InProgress, []);

        HttpResponseMessage complete = await client.PostAsync($"/api/workouts/{started.Id}/complete", null);

        WorkoutResponse completed = (await complete.Content.ReadFromJsonAsync<WorkoutResponse>(StarterApiFactory.Json))!;
        Assert.InRange(completed.DurationSeconds!.Value, 0, 60);
    }

    [Fact]
    public async Task Starting_a_plan_copies_it_and_keeps_the_plan()
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();
        int squat = await ExerciseIdAsync(client, "Squat");
        WorkoutResponse plan = await CreateAsync(client, WorkoutStatus.Planned, [new(squat, null, [new(false, 100, 5, true), new(true, 50, 10, true)])]);

        HttpResponseMessage response = await client.PostAsync($"/api/workouts/{plan.Id}/start", null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        WorkoutResponse started = (await response.Content.ReadFromJsonAsync<WorkoutResponse>(StarterApiFactory.Json))!;
        Assert.NotEqual(plan.Id, started.Id);
        Assert.Equal(WorkoutStatus.InProgress, started.Status);
        Assert.Equal(plan.Id, started.SourcePlanId);
        Assert.Equal([true, false], started.Exercises.Single().Sets.Select(s => s.IsWarmup));
        Assert.All(started.Exercises.Single().Sets, s => Assert.False(s.IsDone));

        WorkoutResponse stillPlanned = (await client.GetFromJsonAsync<WorkoutResponse>($"/api/workouts/{plan.Id}", StarterApiFactory.Json))!;
        Assert.Equal(WorkoutStatus.Planned, stillPlanned.Status);
        WorkoutResponse current = (await client.GetFromJsonAsync<WorkoutResponse>("/api/workouts/current", StarterApiFactory.Json))!;
        Assert.Equal(started.Id, current.Id);
    }

    [Fact]
    public async Task Only_one_workout_can_be_in_progress()
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();
        WorkoutResponse plan = await CreateAsync(client, WorkoutStatus.Planned, []);
        await CreateAsync(client, WorkoutStatus.InProgress, []);

        HttpResponseMessage second = await client.PostAsJsonAsync("/api/workouts",
            new CreateWorkoutRequest(WorkoutStatus.InProgress, null, null, null, null), StarterApiFactory.Json);
        HttpResponseMessage fromPlan = await client.PostAsync($"/api/workouts/{plan.Id}/start", null);

        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, fromPlan.StatusCode);
    }

    [Fact]
    public async Task Invalid_status_changes_are_rejected()
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();
        WorkoutResponse plan = await CreateAsync(client, WorkoutStatus.Planned, []);
        WorkoutResponse started = await CreateAsync(client, WorkoutStatus.InProgress, []);
        await client.PostAsync($"/api/workouts/{started.Id}/complete", null);

        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync($"/api/workouts/{plan.Id}/complete", null)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync($"/api/workouts/{started.Id}/start", null)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync($"/api/workouts/{started.Id}/complete", null)).StatusCode);

        HttpResponseMessage createCompleted = await client.PostAsJsonAsync("/api/workouts",
            new CreateWorkoutRequest(WorkoutStatus.Completed, null, null, null, null), StarterApiFactory.Json);
        Assert.Equal(HttpStatusCode.BadRequest, createCompleted.StatusCode);
    }

    [Fact]
    public async Task Invalid_content_is_rejected()
    {
        (HttpClient owner, HttpClient other) = await TwoUsersAsync();
        int benchPress = await ExerciseIdAsync(owner, "Bench Press");
        HttpResponseMessage custom = await other.PostAsJsonAsync("/api/exercises",
            new CreateExerciseRequest($"Secret Lift {Guid.NewGuid():N}", null, null, null, null, null, null), StarterApiFactory.Json);
        int othersExercise = (await custom.Content.ReadFromJsonAsync<ExerciseResponse>(StarterApiFactory.Json))!.Id;

        List<WorkoutExerciseRequest>[] invalid =
        [
            [new(999_999, null, [])],
            [new(othersExercise, null, [])],
            [new(benchPress, null, [new(false, -5, 5, false)])],
            [new(benchPress, null, [new(false, 50, -1, false)])]
        ];

        foreach (List<WorkoutExerciseRequest> exercises in invalid)
        {
            HttpResponseMessage response = await owner.PostAsJsonAsync("/api/workouts",
                new CreateWorkoutRequest(WorkoutStatus.Planned, null, null, null, exercises), StarterApiFactory.Json);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }

    [Fact]
    public async Task Warm_ups_come_first_and_exercise_order_is_kept()
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();
        int squat = await ExerciseIdAsync(client, "Squat");
        int deadlift = await ExerciseIdAsync(client, "Deadlift");

        WorkoutResponse workout = await CreateAsync(client, WorkoutStatus.Planned,
        [
            new(squat, null, [new(false, 100, 5, false), new(true, 40, 10, false), new(false, 105, 3, false), new(true, 60, 5, false)]),
            new(deadlift, null, []),
            new(squat, null, [])
        ]);

        Assert.Equal(["Squat", "Deadlift", "Squat"], workout.Exercises.Select(e => e.ExerciseName));
        Assert.Equal([40m, 60m, 100m, 105m], workout.Exercises[0].Sets.Select(s => s.WeightKg));
    }

    [Fact]
    public async Task Lists_are_sorted_the_way_the_screens_show_them()
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();
        DateTime today = DateTime.UtcNow.Date;
        WorkoutResponse undated = await CreatePlanAsync(client, null);
        WorkoutResponse later = await CreatePlanAsync(client, today.AddDays(5));
        WorkoutResponse sooner = await CreatePlanAsync(client, today.AddDays(1));

        List<WorkoutSummaryResponse> plans = await ListAsync(client, "?status=Planned");

        Assert.Equal([sooner.Id, later.Id, undated.Id], plans.Select(p => p.Id));

        WorkoutResponse first = await CreateAsync(client, WorkoutStatus.InProgress, []);
        await client.PostAsync($"/api/workouts/{first.Id}/complete", null);
        WorkoutResponse second = await CreateAsync(client, WorkoutStatus.InProgress, []);
        await client.PostAsync($"/api/workouts/{second.Id}/complete", null);

        List<WorkoutSummaryResponse> history = await ListAsync(client, "?status=Completed");
        Assert.Equal([second.Id, first.Id], history.Select(w => w.Id));
        Assert.Equal(5, (await ListAsync(client, "")).Count);
    }

    [Fact]
    public async Task A_workout_is_visible_only_to_its_owner()
    {
        (HttpClient owner, HttpClient other) = await TwoUsersAsync();
        WorkoutResponse plan = await CreateAsync(owner, WorkoutStatus.Planned, []);
        SaveWorkoutRequest save = new("Hijack", null, null, null, []);

        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"/api/workouts/{plan.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.PutAsJsonAsync($"/api/workouts/{plan.Id}", save, StarterApiFactory.Json)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.PostAsync($"/api/workouts/{plan.Id}/start", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.DeleteAsync($"/api/workouts/{plan.Id}")).StatusCode);
        Assert.Empty(await ListAsync(other, ""));
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync($"/api/workouts/{plan.Id}")).StatusCode);
    }

    [Fact]
    public async Task Deleting_a_plan_keeps_the_workouts_started_from_it()
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();
        WorkoutResponse plan = await CreateAsync(client, WorkoutStatus.Planned, []);
        WorkoutResponse started = (await (await client.PostAsync($"/api/workouts/{plan.Id}/start", null))
            .Content.ReadFromJsonAsync<WorkoutResponse>(StarterApiFactory.Json))!;

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/workouts/{plan.Id}")).StatusCode);

        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/workouts/{plan.Id}")).StatusCode);
        WorkoutResponse kept = (await client.GetFromJsonAsync<WorkoutResponse>($"/api/workouts/{started.Id}", StarterApiFactory.Json))!;
        Assert.Null(kept.SourcePlanId);
    }

    [Fact]
    public async Task Dates_come_back_as_utc()
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();
        WorkoutResponse started = await CreateAsync(client, WorkoutStatus.InProgress, []);

        string json = await client.GetStringAsync($"/api/workouts/{started.Id}");

        Assert.Matches("\"startedAtUtc\":\"[^\"]+Z\"", json);
    }

    [Fact]
    public async Task Visitors_get_401()
    {
        HttpClient anonymous = factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/workouts")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/workouts/current")).StatusCode);
    }

    private async Task<(HttpClient Owner, HttpClient Other)> TwoUsersAsync()
    {
        (_, HttpClient owner) = await factory.RegisterUserAsync();
        (_, HttpClient other) = await factory.RegisterUserAsync();
        return (owner, other);
    }

    private static async Task<int> ExerciseIdAsync(HttpClient client, string name)
    {
        List<ExerciseResponse> exercises = (await client.GetFromJsonAsync<List<ExerciseResponse>>("/api/exercises", StarterApiFactory.Json))!;
        return exercises.Single(e => e.Name == name).Id;
    }

    private static async Task<WorkoutResponse> CreateAsync(HttpClient client, WorkoutStatus status, List<WorkoutExerciseRequest> exercises)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync("/api/workouts",
            new CreateWorkoutRequest(status, null, null, null, exercises), StarterApiFactory.Json);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<WorkoutResponse>(StarterApiFactory.Json))!;
    }

    private static async Task<WorkoutResponse> CreatePlanAsync(HttpClient client, DateTime? plannedFor)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync("/api/workouts",
            new CreateWorkoutRequest(WorkoutStatus.Planned, null, null, plannedFor, []), StarterApiFactory.Json);
        return (await response.Content.ReadFromJsonAsync<WorkoutResponse>(StarterApiFactory.Json))!;
    }

    private static async Task<List<WorkoutSummaryResponse>> ListAsync(HttpClient client, string query)
        => (await client.GetFromJsonAsync<List<WorkoutSummaryResponse>>($"/api/workouts{query}", StarterApiFactory.Json))!;
}
