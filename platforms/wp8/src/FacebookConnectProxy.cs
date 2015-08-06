// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved.
// Licensed under the Apache License, Version 2.0.
// See LICENSE in the project root for license information.

using Facebook;
using Facebook.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Threading.Tasks;
using System.Windows;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;
using WPCordovaClassLib.Cordova.JSON;

// ReSharper disable once CheckNamespace
namespace Cordova.Extension.Commands
{
    #region Extensions

    /// <summary>
    /// Helper class that contain extension methods for AccessTokenData class
    /// </summary>
    public static class Extensions
    {
        /// <summary>
        /// Checks if there is new permissions required for current AccessTokenData
        /// </summary>
        /// <param name="tokenData">AccessTokenData object to check for permissions</param>
        /// <param name="newPermissions">Permissions array that should be verified</param>
        /// <returns>True if token nneds to be extended with new permissions</returns>
        internal static bool NeedNewPermissions(this AccessTokenData tokenData, string[] newPermissions)
        {
            var tempPermissions = tokenData.CurrentPermissions.Intersect(newPermissions);
            return tempPermissions.Count() < newPermissions.Count();
        }

        /// <summary>
        /// Creates a new AccessTokenData object and copies all the properties from the source one.
        /// </summary>
        /// <param name="tokenData">Source AccessTokenData object</param>
        /// <returns>Cloned AccessTokenData object</returns>
        internal static AccessTokenData Clone(this AccessTokenData tokenData)
        {
            return new AccessTokenData
            {
                AccessToken = tokenData.AccessToken,
                AppId = tokenData.AppId,
                CurrentPermissions = tokenData.CurrentPermissions,
                Expires = tokenData.Expires,
                FacebookId = tokenData.FacebookId,
                Issued = tokenData.Issued
            };
        }
    }

    #endregion Extensions

    #region Data structures

    [DataContract]
    internal struct LoginStatus
    {
        [DataMember(Name = "authResponse")]
        public AuthResponse AuthResponse;

        [DataMember(Name = "status")]
        public string Status;
    }

    [DataContract]
    internal struct PermissionsError
    {
        [DataMember(Name = "code")]
        public string Code;

        [DataMember(Name = "permissions_uri")]
        public string Uri;
    }

    [DataContract]
    internal struct AuthResponse
    {
        [DataMember(Name = "accessToken")]
        public string AccessToken;

        [DataMember(Name = "expiresIn")]
        public DateTime ExpiresIn;

        [DataMember(Name = "userID")]
        public string UserId;
    }

    [DataContract]
    internal struct DialogOption
    {
        [DataMember(Name = "name")]
        public string Name;

        [DataMember(Name = "value")]
        public object Value;
    }

    #endregion Data structures

    // ReSharper disable once UnusedMember.Global
    public sealed class FacebookConnectPlugin : BaseCommand
    {
        private const string LOGIN_RESPONSE_TYPE = "token";
        private const string DIALOG_DISPLAY_TYPE = "touch";
        private const string LOGIN_REDIRECT_URI = "https://www.facebook.com/connect/login_success.html";

        private static FacebookClient _fbClient;

        /// <summary>
        /// Gets an existing FacebookClient instance or creates
        /// a new one and ensures that its parameters are actual.
        /// </summary>
        private static FacebookClient FbClient
        {
            get
            {
                var accessToken = CurrentTokenData.AccessToken;
                if (_fbClient == null || _fbClient.AppId != Session.AppId || _fbClient.AccessToken != accessToken)
                {
                    _fbClient = new FacebookClient
                    {
                        AccessToken = accessToken,
                        AppId = Session.AppId
                    };
                }

                return _fbClient;
            }
        }

        /// <summary>
        /// Gets and sets CurrentAccessTokenData property fromActiveSession.
        /// Used as a shortcut.
        /// </summary>
        private static AccessTokenData CurrentTokenData
        {
            get { return Session.ActiveSession.CurrentAccessTokenData; }
            set { Session.ActiveSession.CurrentAccessTokenData = value; }
        }

        // ReSharper disable InconsistentNaming, UnusedMember.Global

        public async void getDialogUri(string options)
        {
            var args = JsonHelper.Deserialize<string[]>(options);
            var dialogType = args[0].ToLower();
            var callbackUrl = args[2];

            string uri;

            if (dialogType == "login")
            {
                var permissions = JsonHelper.Deserialize<string[]>(args[1]);
                uri = await GetLoginUri(permissions, callbackUrl);
            }
            else
            {
                var dialogOptions = JsonHelper.Deserialize<DialogOption[]>(args[3])
                    .ToDictionary(dialogOption => dialogOption.Name, dialogOption => dialogOption.Value);

                uri = await GetDialogUri(dialogType, callbackUrl, dialogOptions);
            }

            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, uri));
        }

        public async void fetchResponseUri(string options)
        {
            var args = JsonHelper.Deserialize<string[]>(options);
            var dialogType = args[0].ToLower();
            var uri = new Uri(args[1], UriKind.Absolute);

            PluginResult result;

            if (dialogType == "login")
            {
                try
                {
                    var tempToken = await FetchLoginUriAsync(uri);
                    var loginStatus = await UpdateAndGetLoginStatus(tempToken);
                    result = new PluginResult(PluginResult.Status.OK, loginStatus);
                }
                catch (Exception e)
                {
                    result = new PluginResult(PluginResult.Status.ERROR, e.Message);
                }
            }
            else
            {
                var dialogData = await FetchDialogUriAsync(uri);
                result = new PluginResult(PluginResult.Status.OK, dialogData);
            }

            DispatchCommandResult(result);
        }

        public async void getLoginStatus(string options)
        {
            var loginStatus = await UpdateAndGetLoginStatus();
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, loginStatus));
        }

        public void getAccessToken(string options)
        {
            Deployment.Current.Dispatcher.BeginInvoke(async () =>
            {
                if (!string.IsNullOrEmpty(CurrentTokenData.AccessToken))
                {
                    await Session.CheckAndExtendTokenIfNeeded();
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, CurrentTokenData.AccessToken));
                    return;
                }

                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "No active sessions found"));
            });
        }

        public void logout(string options)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                Session.ActiveSession.Logout();
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
            });
        }

        public void graphApi(string options)
        {
            var args = JsonHelper.Deserialize<List<string>>(options);
            var apiPath = args[0];
            var permissions = JsonHelper.Deserialize<string[]>(args[1]);

            Deployment.Current.Dispatcher.BeginInvoke(async () =>
            {
                if (string.IsNullOrEmpty(CurrentTokenData.AccessToken))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "No active sessions found"));
                    return;
                }

                if (CurrentTokenData.NeedNewPermissions(permissions))
                {
                    var permError = new PermissionsError
                    {
                        Code = "permissions_missing",
                        Uri =
                            await GetDialogUri("oauth", LOGIN_REDIRECT_URI, new Dictionary<string, object>
                            {
                                {"auth_type", "rerequest"},
                                {"response_type", LOGIN_RESPONSE_TYPE},
                                {"scope", string.Join(",", permissions)}
                            })
                    };

                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, permError));
                    return;
                }

                await Session.CheckAndExtendTokenIfNeeded();

                try
                {
                    dynamic result = await FbClient.GetTaskAsync(apiPath);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, result.ToString()));
                }
                catch (Exception ex)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, ex.Message));
                }

            });
        }

        // ReSharper restore InconsistentNaming, UnusedMember.Global

        #region Private methods

        /// <summary>
        /// Updates an AccessTokenData object with data fetched from FB API.
        /// Updates ActiveSession with updated AccessTokenData object.
        /// Uses CurrentAccessTokenData if parameter is null
        /// </summary>
        /// <param name="tempToken">AccessTokenData object to update</param>
        /// <returns>LoginStatus object</returns>
        private static Task<LoginStatus> UpdateAndGetLoginStatus(AccessTokenData tempToken = null)
        {
            var tcs = new TaskCompletionSource<LoginStatus>();

            Deployment.Current.Dispatcher.BeginInvoke(async () =>
            {
                if (tempToken != null) CurrentTokenData = tempToken;

                if (string.IsNullOrEmpty(CurrentTokenData.AccessToken))
                {
                    tcs.SetResult(new LoginStatus { Status = "unknown" });
                    return;
                }

                await Session.CheckAndExtendTokenIfNeeded();

                if (CurrentTokenData.CurrentPermissions.Count == 0 || string.IsNullOrEmpty(CurrentTokenData.FacebookId))
                {
                    // Create a copy of existing access token data to update it with new values
                    var newTokenData = CurrentTokenData.Clone();

                    try
                    {
                        var result =
                            (JsonObject)
                                await
                                    FbClient.GetTaskAsync("debug_token",
                                        new { input_token = CurrentTokenData.AccessToken });

                        var data = (JsonObject)result.ToDictionary(pair => pair.Key, pair => pair.Value)["data"];

                        var userId = (string)data.ToDictionary(pair => pair.Key, pair => pair.Value)["user_id"];
                        newTokenData.FacebookId = userId;

                        var actualPermissions = (JsonArray)data.ToDictionary(pair => pair.Key, pair => pair.Value)["scopes"];
                        foreach (var actualPermission in actualPermissions)
                        {
                            newTokenData.CurrentPermissions.Add((string)actualPermission);
                        }

                        Session.ActiveSession.CurrentAccessTokenData = newTokenData;
                    }
                    catch
                    {
                        // No need to fail here, just return a loginStatus object without userID
                    }
                }

                var loginStatus = new LoginStatus
                {
                    Status = "connected",
                    AuthResponse = new AuthResponse
                    {
                        AccessToken = CurrentTokenData.AccessToken,
                        ExpiresIn = CurrentTokenData.Expires,
                        UserId = CurrentTokenData.FacebookId
                    }
                };

                tcs.SetResult(loginStatus);
            });

            return tcs.Task;
        }

        /// <summary>
        /// Creates uri for login dialog
        /// </summary>
        /// <param name="permissions">Array of scopes, required by application</param>
        /// <param name="redirectUrl">Callback uri which is called after dialog completes</param>
        private static Task<string> GetLoginUri(string[] permissions, string redirectUrl)
        {
            var tcs = new TaskCompletionSource<string>();

            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                var loginParams = new Dictionary<string, object>();

                loginParams["client_id"] = Session.AppId;
                loginParams["redirect_uri"] = redirectUrl;
                loginParams["response_type"] = LOGIN_RESPONSE_TYPE;
                loginParams["display"] = DIALOG_DISPLAY_TYPE;
                loginParams["mobile"] = true;

                // add the 'scope' only if we have extendedPermissions.
                if (permissions.Length > 0)
                {
                    // A comma-delimited list of permissions
                    loginParams["scope"] = string.Join(",", permissions);
                }

                tcs.SetResult(FbClient.GetLoginUrl(loginParams).ToString());
            });

            return tcs.Task;
        }

        /// <summary>
        /// Creates uri for specific dialog
        /// </summary>
        /// <param name="dialogType">Name of dialog, which is added to URI query parameters</param>
        /// <param name="redirectUrl">Callback uri which is called after dialog completes</param>
        /// <param name="dialogOptions">Dictionary of additional options which will be added to dialog URI as query parameters</param>
        private static Task<string> GetDialogUri(string dialogType, string redirectUrl, Dictionary<string, object> dialogOptions)
        {
            var tcs = new TaskCompletionSource<string>();

            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                var appId = Session.AppId;
                dialogOptions["client_id"] = appId;
                dialogOptions["redirect_uri"] = redirectUrl;
                dialogOptions["display"] = DIALOG_DISPLAY_TYPE;
                dialogOptions["mobile"] = true;

                tcs.SetResult(FbClient.GetDialogUrl(dialogType, dialogOptions).ToString());
            });

            return tcs.Task;
        }

        /// <summary>
        /// Fetches data returned by login dialog from callback uri. Creates and saves new AccessTokenData object to current session.
        /// Calls getLoginStatus internally to fill AccessTokenData with such values as FacebookId and CurrentPermissions
        /// </summary>
        /// <param name="uri">Callback uri of login dialog</param>
        private static Task<AccessTokenData> FetchLoginUriAsync(Uri uri)
        {
            var tcs = new TaskCompletionSource<AccessTokenData>();

            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                var oauthResult = FbClient.ParseOAuthCallbackUrl(uri);
                if (oauthResult.IsSuccess)
                {
                    var tempToken = new AccessTokenData
                    {
                        AccessToken = oauthResult.AccessToken,
                        Expires = oauthResult.Expires
                    };

                    tcs.SetResult(tempToken);
                }
                else
                {
                    tcs.SetException(new Exception(oauthResult.Error));
                }
            });

            return tcs.Task;
        }

        /// <summary>
        /// Fetches data returned by dialog from callback uri
        /// </summary>
        /// <param name="uri">Callback uri of dialog</param>
        private static Task<object> FetchDialogUriAsync(Uri uri)
        {
            var tcs = new TaskCompletionSource<object>();

            Deployment.Current.Dispatcher.BeginInvoke(() => tcs.SetResult(FbClient.ParseDialogCallbackUrl(uri)));

            return tcs.Task;
        }

        #endregion Private methods
    }
}
