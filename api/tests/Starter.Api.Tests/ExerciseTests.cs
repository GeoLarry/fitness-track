using System.Net;
using System.Net.Http.Json;
using Starter.Core.Contracts;

namespace Starter.Api.Tests;

public class ExerciseTests(StarterApiFactory factory) : IClassFixture<StarterApiFactory>
{
    [Fact]
    public async Task The_catalog_is_seeded_with_muscles_equipment_and_types()
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();

        List<ExerciseResponse> exercises = (await client.GetFromJsonAsync<List<ExerciseResponse>>("/api/exercises", StarterApiFactory.Json))!;
        List<CatalogItemResponse> muscles = (await client.GetFromJsonAsync<List<CatalogItemResponse>>("/api/muscles", StarterApiFactory.Json))!;
        List<CatalogItemResponse> equipment = (await client.GetFromJsonAsync<List<CatalogItemResponse>>("/api/equipment", StarterApiFactory.Json))!;
        List<CatalogItemResponse> types = (await client.GetFromJsonAsync<List<CatalogItemResponse>>("/api/exercise-types", StarterApiFactory.Json))!;

        ExerciseResponse benchPress = Assert.Single(exercises, e => e.Name == "Bench Press");
        int chestId = Assert.Single(muscles, m => m.Name == "Chest").Id;
        Assert.Contains(chestId, benchPress.PrimaryMuscleIds);
        Assert.False(benchPress.IsCustom);

        Assert.Contains(equipment, e => e.Name == "Barbell");
        Assert.Equal(["Cardio", "Strength"], types.Select(t => t.Name));
        Assert.Equal(exercises.OrderBy(e => e.Name.ToUpperInvariant()).Select(e => e.Name), exercises.Select(e => e.Name));
    }

    [Fact]
    public async Task A_custom_exercise_is_visible_only_to_its_creator()
    {
        (_, HttpClient owner) = await factory.RegisterUserAsync();
        (_, HttpClient other) = await factory.RegisterUserAsync();
        List<CatalogItemResponse> muscles = (await owner.GetFromJsonAsync<List<CatalogItemResponse>>("/api/muscles", StarterApiFactory.Json))!;
        int quads = muscles.Single(m => m.Name == "Quads").Id;
        int glutes = muscles.Single(m => m.Name == "Glutes").Id;

        CreateExerciseRequest request = new($"Sled Push {Guid.NewGuid():N}", "Push the sled", "Lean in\nDrive with the legs", null, null, [quads], [glutes]);
        HttpResponseMessage response = await owner.PostAsJsonAsync("/api/exercises", request, StarterApiFactory.Json);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        ExerciseResponse created = (await response.Content.ReadFromJsonAsync<ExerciseResponse>(StarterApiFactory.Json))!;
        Assert.True(created.IsCustom);
        Assert.Equal([quads], created.PrimaryMuscleIds);
        Assert.Equal([glutes], created.SecondaryMuscleIds);

        List<ExerciseResponse> ownerList = (await owner.GetFromJsonAsync<List<ExerciseResponse>>("/api/exercises", StarterApiFactory.Json))!;
        List<ExerciseResponse> otherList = (await other.GetFromJsonAsync<List<ExerciseResponse>>("/api/exercises", StarterApiFactory.Json))!;
        Assert.Contains(ownerList, e => e.Id == created.Id);
        Assert.DoesNotContain(otherList, e => e.Id == created.Id);
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"/api/exercises/{created.Id}")).StatusCode);
    }

    [Fact]
    public async Task A_custom_exercise_cannot_repeat_a_name_the_user_already_sees()
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/exercises",
            new CreateExerciseRequest("bench press", null, null, null, null, null, null), StarterApiFactory.Json);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task A_custom_exercise_needs_a_name(string name)
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/exercises",
            new CreateExerciseRequest(name, null, null, null, null, null, null), StarterApiFactory.Json);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Unknown_muscles_are_rejected()
    {
        (_, HttpClient client) = await factory.RegisterUserAsync();

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/exercises",
            new CreateExerciseRequest($"Mystery {Guid.NewGuid():N}", null, null, null, null, [999_999], null), StarterApiFactory.Json);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Visitors_get_401()
    {
        HttpClient anonymous = factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/exercises")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/muscles")).StatusCode);
    }

    [Fact]
    public async Task The_coach_role_exists_as_a_built_in_role()
    {
        HttpClient admin = await factory.CreateAdminClientAsync();

        List<RoleResponse> roles = (await admin.GetFromJsonAsync<List<RoleResponse>>("/api/roles", StarterApiFactory.Json))!;

        RoleResponse coach = Assert.Single(roles, r => r.Name == "Coach");
        Assert.True(coach.IsSystemRole);
    }
}
