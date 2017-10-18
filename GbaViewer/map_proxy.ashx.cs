
using System;
using System.Drawing;
using System.IO;
using System.Web;
using System.Collections.Generic;

using System.Xml.Schema;
using System.Xml;
using  System.Text.RegularExpressions;
using System.Text;

//using GbaViewer.Entities;

namespace GbaViewer
{
    /// <summary>
    /// Forwards requests to an ArcGIS Server REST resource. Uses information in
    /// the proxy.config file to determine properties of the server.
    /// </summary>
    public class map_proxy : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {

            HttpResponse response = context.Response;

            // Get the URL requested by the client (take the entire querystring at once
            //  to handle the case of the URL itself containing querystring parameters)
            string url = context.Request.Url.Query.Substring(1);
            var strReq = new StringBuilder(url);
            if (!url.Contains("?"))
                strReq.Append("?");
            if (!strReq.ToString().EndsWith("&") && !strReq.ToString().EndsWith("?"))
                strReq.Append("&");
            if (!url.ToLower().Contains("service=wms"))
                strReq.AppendFormat("SERVICE=WMS&");
            if (!url.ToLower().Contains("request=getcapabilities"))
                strReq.AppendFormat("REQUEST=GetCapabilities&");
            url = strReq.ToString();
            Uri uri = new Uri(url);
            var capabilities = new WmsCapabilities(uri, null);
            // Pass "company" object for conversion object to JSON string
            string json = new System.Web.Script.Serialization.JavaScriptSerializer().Serialize(capabilities);
            response.Write(json);

            //.Net JavaScripSerializer -> Processing the result:
            //System.Web.Script.Serialization.JavaScriptSerializer serializer = new System.Web.Script.Serialization.JavaScriptSerializer();
            //List<WebMapLayer> layerList = serializer.Deserialize<List<WebMapLayer>>(jsonString);
            //WebMapLayer webMapLayer = serializer.Deserialize<WebMapLayer>(str);

            // Get token, if applicable, and append to the request
            //string token = getTokenFromConfigFile(uri);
            //string token = uri;
            //if (!String.IsNullOrEmpty(token))
            //{
            //    if (uri.Contains("?"))
            //        uri += "&token=" + token;
            //    else
            //        uri += "?token=" + token;
            //}

            //System.Net.HttpWebRequest req = (System.Net.HttpWebRequest)System.Net.HttpWebRequest.Create(uri);
            //req.Method = context.Request.HttpMethod;
            //req.ServicePoint.Expect100Continue = false;

            //// Set body of request for POST requests
            //if (context.Request.InputStream.Length > 0)
            //{
            //    byte[] bytes = new byte[context.Request.InputStream.Length];
            //    context.Request.InputStream.Read(bytes, 0, (int)context.Request.InputStream.Length);
            //    req.ContentLength = bytes.Length;

            //    string ctype = context.Request.ContentType;
            //    if (String.IsNullOrEmpty(ctype))
            //    {
            //        req.ContentType = "application/x-www-form-urlencoded";
            //    }
            //    else
            //    {
            //        req.ContentType = ctype;
            //    }

            //    using (Stream outputStream = req.GetRequestStream())
            //    {
            //        outputStream.Write(bytes, 0, bytes.Length);
            //    }
            //}

            //// Send the request to the server
            //System.Net.WebResponse serverResponse = null;
            //try
            //{
            //    serverResponse = req.GetResponse();
            //}
            //catch (System.Net.WebException webExc)
            //{
            //    response.StatusCode = 500;
            //    response.StatusDescription = webExc.Status.ToString();
            //    response.Write(webExc.Status.ToString());
            //    response.End();
            //    return;
            //}

            // Set up the response to the client
            //if (serverResponse != null)
            //{
            //    response.ContentType = serverResponse.ContentType;//("text");
            //    using (Stream byteStream = serverResponse.GetResponseStream())
            //    {

            //        // Text response
            //        if (serverResponse.ContentType.Contains("text") ||
            //            serverResponse.ContentType.Contains("json"))
            //        {
            //            using (StreamReader sr = new StreamReader(byteStream))
            //            {
            //                string strXmlResponse = sr.ReadToEnd();
                            


            //                //var jsonResponse = Json.XmlToJSON(strResponse);
            //                XmlDocument xmlDoc = new XmlDocument();
            //                xmlDoc.LoadXml(strXmlResponse);
            //                string jsonResponse = string.Empty;
            //                try
            //                {
            //                    //jsonResponse = Newtonsoft.Json.JsonConvert.SerializeXmlNode(xmlDoc);
            //                    jsonResponse = Newtonsoft.Json.JsonConvert.SerializeObject(xmlDoc, Newtonsoft.Json.Formatting.None);
            //                    jsonResponse = Regex.Replace(jsonResponse, "(?<=\")(@)(?!.*\":\\s )", string.Empty, RegexOptions.IgnoreCase);
            //                }
            //                catch (Exception ex)
            //                {
            //                    response.StatusCode = 500;
            //                    response.StatusDescription = ex.Message.ToString();
            //                    response.Write(ex.Message.ToString());
            //                    response.End();
            //                    return;
            //                }
            //                response.Write(jsonResponse);
            //                //response.Write(strXmlResponse);
            //            }
            //        }
            //        else
            //        {
            //            // Binary response (image, lyr file, other binary file)
            //            BinaryReader br = new BinaryReader(byteStream);
            //            byte[] outb = br.ReadBytes((int)serverResponse.ContentLength);
            //            br.Close();

            //            // Tell client not to cache the image since it's dynamic
            //            response.CacheControl = "no-cache";

            //            // Send the image to the client
            //            // (Note: if large images/files sent, could modify this to send in chunks)
            //            response.OutputStream.Write(outb, 0, outb.Length);
            //        }

            //        serverResponse.Close();
            //    }
            //}
            response.End();
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }

    }
}

