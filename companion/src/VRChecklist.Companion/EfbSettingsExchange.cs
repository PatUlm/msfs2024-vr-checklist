using System.Text.Json;
using VRChecklist.Transport;

namespace VRChecklist.Companion;

/** UI requests wake the SimConnect worker; all native calls stay on that worker. */
internal sealed class EfbSettingsExchange : IDisposable
{
    private readonly object gate = new();
    private readonly Dictionary<string, Request> pending = [];
    private readonly Queue<Request> outgoing = [];
    private bool connected;
    private bool disposed;
    internal AutoResetEvent Signal { get; } = new(false);

    internal void SetConnected(bool value)
    {
        lock (gate)
        {
            connected = value && !disposed;
            if (connected) return;
            foreach (var request in pending.Values)
                request.Completion.TrySetException(new IOException("Waiting for the EFB connection."));
            pending.Clear();
            outgoing.Clear();
        }
    }

    internal async Task<EfbSettingsResponse> ApplyAsync(
        string instanceId, IReadOnlyDictionary<string, bool> actions, TimeSpan? timeout = null)
    {
        var id = Guid.NewGuid().ToString("N");
        var request = new Request(id, instanceId, EfbSettingsProtocol.CreateRequest(id, instanceId, actions));
        lock (gate)
        {
            if (!connected || disposed) throw new IOException("Waiting for the EFB connection.");
            pending.Add(id, request);
            outgoing.Enqueue(request);
            Signal.Set();
        }
        try
        {
            return await request.Completion.Task.WaitAsync(timeout ?? TimeSpan.FromSeconds(5)).ConfigureAwait(false);
        }
        finally
        {
            lock (gate) pending.Remove(id);
        }
    }

    internal void SendPending(Action<string, string> send)
    {
        while (true)
        {
            Request request;
            lock (gate)
            {
                if (!outgoing.TryDequeue(out request!)) return;
                // Timed-out or disconnected requests must never be replayed later.
                if (!pending.ContainsKey(request.Id)) continue;
            }
            send(EfbSettingsProtocol.RequestEvent, request.Payload);
        }
    }

    internal void Receive(string payload)
    {
        EfbSettingsResponse response;
        try { response = EfbSettingsProtocol.ParseResponse(payload); }
        catch (Exception error) when (error is JsonException or InvalidDataException) { return; }
        lock (gate)
        {
            if (pending.TryGetValue(response.RequestId, out var request) && request.InstanceId == response.InstanceId)
                request.Completion.TrySetResult(response);
        }
    }

    public void Dispose()
    {
        lock (gate)
        {
            if (disposed) return;
            disposed = true;
            SetConnected(false);
            Signal.Dispose();
        }
    }

    private sealed record Request(string Id, string InstanceId, string Payload)
    {
        internal TaskCompletionSource<EfbSettingsResponse> Completion { get; } =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
    }
}
