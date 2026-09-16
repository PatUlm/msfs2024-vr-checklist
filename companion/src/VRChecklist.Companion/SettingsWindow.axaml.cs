using Avalonia.Controls;
using Avalonia.Interactivity;

namespace VRChecklist.Companion;

public sealed partial class SettingsWindow : Window
{
    public SettingsWindow()
    {
        InitializeComponent();
        Activated += (_, _) => ViewModel?.RefreshDevices();
    }

    public SettingsWindow(AudioSettingsViewModel viewModel) : this()
    {
        DataContext = viewModel;
        viewModel.RefreshDevices();
    }

    private AudioSettingsViewModel? ViewModel => DataContext as AudioSettingsViewModel;

    private void OnOutputListOpened(object? sender, EventArgs args) => ViewModel?.RefreshDevices();

    private async void OnTestSoundClick(object? sender, RoutedEventArgs args)
    {
        if (ViewModel is { } viewModel) await viewModel.TestAsync();
    }

    private void OnCloseClick(object? sender, RoutedEventArgs args) => Close();
}
