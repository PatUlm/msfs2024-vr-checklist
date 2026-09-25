using Avalonia.Controls;
using Avalonia.Interactivity;

namespace VRChecklist.Companion;

public sealed partial class SettingsWindow : Window
{
    public SettingsWindow()
    {
        InitializeComponent();
        Activated += async (_, _) =>
        {
            if (ViewModel is not { } viewModel) return;
            viewModel.Audio.RefreshDevices();
            await viewModel.Efb.SynchronizeAsync();
        };
    }

    public SettingsWindow(SettingsViewModel viewModel) : this()
    {
        DataContext = viewModel;
        viewModel.Audio.RefreshDevices();
    }

    private SettingsViewModel? ViewModel => DataContext as SettingsViewModel;

    private void OnOutputListOpened(object? sender, EventArgs args) => ViewModel?.Audio.RefreshDevices();

    private async void OnTestSoundClick(object? sender, RoutedEventArgs args)
    {
        if (ViewModel is { } viewModel) await viewModel.Audio.TestAsync();
    }

    private void OnCloseClick(object? sender, RoutedEventArgs args) => Close();
}
