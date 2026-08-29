using System.Reflection;
using System.Runtime.InteropServices;

namespace VRChecklist.TransportProbe;

internal static class SimConnectNative
{
    internal const uint ReceiveIdQuit = 3;
    internal const uint ReceiveIdCommBus = 43;
    internal const uint BroadcastToJs = 1U << 0;

    private const string LibraryName = "SimConnect.dll";

    static SimConnectNative()
    {
        NativeLibrary.SetDllImportResolver(
            typeof(SimConnectNative).Assembly,
            ResolveLibrary);
    }

    internal static void EnsureResolverRegistered()
    {
        // Calling this method runs the static constructor before the first
        // P/Invoke and makes the optional SDK path resolver deterministic.
    }

    private static nint ResolveLibrary(
        string libraryName,
        Assembly assembly,
        DllImportSearchPath? searchPath)
    {
        if (!string.Equals(libraryName, LibraryName, StringComparison.Ordinal))
        {
            return nint.Zero;
        }

        var directory = Environment.GetEnvironmentVariable(
            "VR_CHECKLIST_SIMCONNECT_DIR");

        if (!string.IsNullOrWhiteSpace(directory))
        {
            var path = Path.Combine(directory, LibraryName);
            return NativeLibrary.Load(path);
        }

        return nint.Zero;
    }

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    internal delegate void DispatchProc(nint data, uint dataSize, nint context);

    [DllImport(LibraryName, CallingConvention = CallingConvention.StdCall,
        CharSet = CharSet.Ansi, EntryPoint = "SimConnect_Open")]
    internal static extern int Open(
        out nint connection,
        [MarshalAs(UnmanagedType.LPStr)] string clientName,
        nint windowHandle,
        uint userEvent,
        nint eventHandle,
        uint configIndex);

    [DllImport(LibraryName, CallingConvention = CallingConvention.StdCall,
        EntryPoint = "SimConnect_Close")]
    internal static extern int Close(nint connection);

    [DllImport(LibraryName, CallingConvention = CallingConvention.StdCall,
        EntryPoint = "SimConnect_CallDispatch")]
    internal static extern int CallDispatch(
        nint connection,
        DispatchProc dispatch,
        nint context);

    [DllImport(LibraryName, CallingConvention = CallingConvention.StdCall,
        CharSet = CharSet.Ansi,
        EntryPoint = "SimConnect_SubscribeToCommBusEvent")]
    internal static extern int SubscribeToCommBusEvent(
        nint connection,
        uint eventId,
        [MarshalAs(UnmanagedType.LPStr)] string eventName);

    [DllImport(LibraryName, CallingConvention = CallingConvention.StdCall,
        EntryPoint = "SimConnect_UnsubscribeToCommBusEvent")]
    internal static extern int UnsubscribeToCommBusEvent(
        nint connection,
        uint eventId);

    [DllImport(LibraryName, CallingConvention = CallingConvention.StdCall,
        CharSet = CharSet.Ansi,
        EntryPoint = "SimConnect_CallCommBusEvent")]
    internal static extern int CallCommBusEvent(
        nint connection,
        [MarshalAs(UnmanagedType.LPStr)] string eventName,
        uint broadcastTo,
        uint bufferSize,
        [In] byte[] data);
}

[StructLayout(LayoutKind.Sequential, Pack = 1)]
internal readonly struct SimConnectReceiveHeader
{
    internal readonly uint Size;
    internal readonly uint Version;
    internal readonly uint Id;
}

[StructLayout(LayoutKind.Sequential, Pack = 1)]
internal readonly struct SimConnectCommBusHeader
{
    internal readonly uint Size;
    internal readonly uint Version;
    internal readonly uint Id;
    internal readonly uint RequestId;
    internal readonly uint ArraySize;
    internal readonly uint EntryNumber;
    internal readonly uint OutOf;
    internal readonly uint EventId;
}
