using System;
using System.Collections.ObjectModel;
using System.Globalization;
using System.IO;
using System.Net;
using System.Text;
using System.Xml;

namespace GbaViewer
{
    public class WmsCapabilities
    {
        #region Fields

        private XmlNode _vendorSpecificCapabilities;
        private XmlNamespaceManager _nsmgr;
        private string[] _exceptionFormats;
        private Collection<string> _getMapOutputFormats;
        private WmsOnlineResource[] _getMapRequests;
        private WmsServerLayer _layer;
        private WmsServiceDescription _serviceDescription;
        private string _wmsVersion;
        private string _capabilitiesUrl;

        #endregion

        #region properties

        /// <summary>
        /// Exposes the capabilitie's VendorSpecificCapabilities as XmlNode object. External modules 
        /// could use this to parse the vendor specific capabilities for their specific purpose.
        /// </summary>
        public XmlNode VendorSpecificCapabilities
        {
            get { return _vendorSpecificCapabilities; }
        }

        /// <summary>
        /// Gets the service description
        /// </summary>
        public WmsServiceDescription ServiceDescription
        {
            get { return _serviceDescription; }
        }

        /// <summary>
        /// Gets url to the capabilities
        /// </summary>
        public string CapabilitiesUrl
        {
            get { return _capabilitiesUrl; }
        }

        /// <summary>
        /// Gets the version of the WMS server (ex. "1.3.0")
        /// </summary>
        public string WmsVersion
        {
            get { return _wmsVersion; }
        }

        /// <summary>
        /// Gets a list of available image mime type formats
        /// </summary>
        public Collection<string> GetMapOutputFormats
        {
            get { return _getMapOutputFormats; }
        }

        /// <summary>
        /// Gets the available GetMap request methods and Online Resource URI
        /// </summary>
        public WmsOnlineResource[] GetMapRequests
        {
            get { return _getMapRequests; }
        }

        /// <summary>
        /// Gets a list of available exception mime type formats
        /// </summary>
        public string[] ExceptionFormats
        {
            get { return _exceptionFormats; }
        }

        /// <summary>
        /// Gets the hiarchial layer structure
        /// </summary>
        public WmsServerLayer Layer
        {
            get { return _layer; }
        }

        #endregion

        //constructor:
        public WmsCapabilities(Uri uri, WebProxy proxy)
        {
            this._capabilitiesUrl = uri.OriginalString;
            Stream stream;
            if (uri.IsAbsoluteUri && uri.IsFile) //assume web if relative because IsFile is not supported on relative paths
            {
                stream = File.OpenRead(uri.LocalPath);
            }
            else
            {
                stream = GetRemoteXmlStream(uri, proxy);
            }

            //if (stream != null)
            //{
            XmlDocument xml = GetXml(stream);
            ParseCapabilities(xml);
            //}
          
        }

        /// <summary>
        /// Parses a servicedescription and stores the data in the ServiceDescription property
        /// </summary>
        /// <param name="doc">XmlDocument containing a valid Service Description</param>
        private void ParseCapabilities(XmlDocument doc)
        {
            if (doc.DocumentElement.Attributes["version"] != null)
            {
                _wmsVersion = doc.DocumentElement.Attributes["version"].Value;
                if (_wmsVersion != "1.0.0" && _wmsVersion != "1.1.0" && _wmsVersion != "1.1.1" && _wmsVersion != "1.3.0")
                    throw new ApplicationException("WMS Version " + _wmsVersion + " not supported");

                _nsmgr.AddNamespace(String.Empty, "http://www.opengis.net/wms");
                _nsmgr.AddNamespace("sm", _wmsVersion == "1.3.0" ? "http://www.opengis.net/wms" : "");
                _nsmgr.AddNamespace("xlink", "http://www.w3.org/1999/xlink");
                _nsmgr.AddNamespace("xsi", "http://www.w3.org/2001/XMLSchema-instance");
            }
            else
                throw (new ApplicationException("No service version number found!"));

            XmlNode xnService = doc.DocumentElement.SelectSingleNode("sm:Service", _nsmgr);
            XmlNode xnCapability = doc.DocumentElement.SelectSingleNode("sm:Capability", _nsmgr);
            if (xnService != null)
                ParseServiceDescription(xnService);
            else
                throw (new ApplicationException("No service tag found!"));


            if (xnCapability != null)
                ParseCapability(xnCapability);
            else
                throw (new ApplicationException("No capability tag found!"));
        }

        /// <summary>
        /// Downloads servicedescription from WMS service
        /// </summary>
        /// <returns>XmlDocument from Url. Null if Url is empty or inproper XmlDocument</returns>
        private XmlDocument GetXml(Stream stream)
        {
            try
            {
                var r = new XmlTextReader(stream);
                r.XmlResolver = null;
                var doc = new XmlDocument();
                doc.XmlResolver = null;
                doc.Load(r);
                stream.Close();
                _nsmgr = new XmlNamespaceManager(doc.NameTable);
                return doc;
            }
            catch (Exception ex)
            {
                throw new ApplicationException("Could not download capabilities", ex);
            }
        }

        private static Stream GetRemoteXmlStream(Uri uri, WebProxy proxy)
        {
            WebRequest myRequest = WebRequest.Create(uri);
            if (proxy != null) myRequest.Proxy = proxy;
            WebResponse myResponse;
            try {
                // Do WebRequest
                myResponse = myRequest.GetResponse();
                Stream stream = myResponse.GetResponseStream();
                return stream;
            }
            catch (WebException ex)
            {
                if (ex.Status == WebExceptionStatus.ProtocolError)
                {
                    HttpWebResponse response = ex.Response as HttpWebResponse;
                    return null;
                    //if (response != null)
                    //{
                    //    // Process response
                    //}
                }
                return null;
            }
           
            //Stream stream = myResponse.GetResponseStream();
            //return stream;
        }

        /// <summary>
        /// Parses service description node
        /// </summary>
        /// <param name="xnlServiceDescription"></param>
        private void ParseServiceDescription(XmlNode xnlServiceDescription)
        {
            XmlNode node = xnlServiceDescription.SelectSingleNode("sm:Title", _nsmgr);
            _serviceDescription.Title = (node != null ? node.InnerText : null);
            node = xnlServiceDescription.SelectSingleNode("sm:OnlineResource/@xlink:href", _nsmgr);
            _serviceDescription.OnlineResource = (node != null ? node.InnerText : null);
            node = xnlServiceDescription.SelectSingleNode("sm:Abstract", _nsmgr);
            _serviceDescription.Abstract = (node != null ? node.InnerText : null);
            node = xnlServiceDescription.SelectSingleNode("sm:Fees", _nsmgr);
            _serviceDescription.Fees = (node != null ? node.InnerText : null);
            node = xnlServiceDescription.SelectSingleNode("sm:AccessConstraints", _nsmgr);
            _serviceDescription.AccessConstraints = (node != null ? node.InnerText : null);

            XmlNodeList xnlKeywords = xnlServiceDescription.SelectNodes("sm:KeywordList/sm:Keyword", _nsmgr);
            if (xnlKeywords != null)
            {
                _serviceDescription.Keywords = new string[xnlKeywords.Count];
                for (var i = 0; i < xnlKeywords.Count; i++)
                    _serviceDescription.Keywords[i] = xnlKeywords[i].InnerText;
            }
            //Contact information
            _serviceDescription.ContactInformation = new WmsServiceDescription.WmsContactInformation();
            node = xnlServiceDescription.SelectSingleNode("sm:ContactInformation/sm:ContactAddress/sm:Address", _nsmgr);
            _serviceDescription.ContactInformation.Address.Address = (node != null ? node.InnerText : null);
            node = xnlServiceDescription.SelectSingleNode("sm:ContactInformation/sm:ContactAddress/sm:AddressType",
                                                          _nsmgr);
            _serviceDescription.ContactInformation.Address.AddressType = (node != null ? node.InnerText : null);
            node = xnlServiceDescription.SelectSingleNode("sm:ContactInformation/sm:ContactAddress/sm:City", _nsmgr);
            _serviceDescription.ContactInformation.Address.City = (node != null ? node.InnerText : null);
            node = xnlServiceDescription.SelectSingleNode("sm:ContactInformation/sm:ContactAddress/sm:Country", _nsmgr);
            _serviceDescription.ContactInformation.Address.Country = (node != null ? node.InnerText : null);
            node = xnlServiceDescription.SelectSingleNode("sm:ContactInformation/sm:ContactAddress/sm:PostCode", _nsmgr);
            _serviceDescription.ContactInformation.Address.PostCode = (node != null ? node.InnerText : null);
            node = xnlServiceDescription.SelectSingleNode("sm:ContactInformation/sm:ContactElectronicMailAddress", _nsmgr);
            _serviceDescription.ContactInformation.Address.StateOrProvince = (node != null ? node.InnerText : null);
            node = xnlServiceDescription.SelectSingleNode("sm:ContactInformation/sm:ContactElectronicMailAddress", _nsmgr);
            _serviceDescription.ContactInformation.ElectronicMailAddress = (node != null ? node.InnerText : null);
            node = xnlServiceDescription.SelectSingleNode("sm:ContactInformation/sm:ContactFacsimileTelephone", _nsmgr);
            _serviceDescription.ContactInformation.FacsimileTelephone = (node != null ? node.InnerText : null);
            node =
                xnlServiceDescription.SelectSingleNode(
                    "sm:ContactInformation/sm:ContactPersonPrimary/sm:ContactOrganization", _nsmgr);
            _serviceDescription.ContactInformation.PersonPrimary.Organisation = (node != null ? node.InnerText : null);
            node =
                xnlServiceDescription.SelectSingleNode(
                    "sm:ContactInformation/sm:ContactPersonPrimary/sm:ContactPerson", _nsmgr);
            _serviceDescription.ContactInformation.PersonPrimary.Person = (node != null ? node.InnerText : null);
            node = xnlServiceDescription.SelectSingleNode("sm:ContactInformation/sm:ContactVoiceTelephone", _nsmgr);
            _serviceDescription.ContactInformation.VoiceTelephone = (node != null ? node.InnerText : null);
        }

        /// <summary>
        /// Parses capability node
        /// </summary>
        /// <param name="xnCapability"></param>
        private void ParseCapability(XmlNode xnCapability)
        {
            XmlNode xnRequest = xnCapability.SelectSingleNode("sm:Request", _nsmgr);
            if (xnRequest == null)
                throw (new Exception("Request parameter not specified in Service Description"));
            ParseRequest(xnRequest);
            
            XmlNode xnLayer = xnCapability.SelectSingleNode("sm:Layer", _nsmgr);
            if (xnLayer == null)
                throw (new Exception("No layer tag found in Service Description"));
            _layer = ParseLayer(xnLayer);

            XmlNode xnException = xnCapability.SelectSingleNode("sm:Exception", _nsmgr);
            if (xnException != null)
                ParseExceptions(xnException);

            _vendorSpecificCapabilities = xnCapability.SelectSingleNode("sm:VendorSpecificCapabilities", _nsmgr);
        }

        /// <summary>
        /// Parses request node
        /// </summary>
        /// <param name="xmlRequestNode"></param>
        private void ParseRequest(XmlNode xmlRequestNode)
        {
            XmlNode xnGetMap = xmlRequestNode.SelectSingleNode("sm:GetMap", _nsmgr);
            ParseGetMapRequest(xnGetMap);
            //TODO: figure out what we need to do with lines below:
            //XmlNode xnGetFeatureInfo = xmlRequestNodes.SelectSingleNode("sm:GetFeatureInfo", nsmgr);
            //XmlNode xnCapa = xmlRequestNodes.SelectSingleNode("sm:GetCapabilities", nsmgr); <-- We don't really need this do we?			
        }

        /// <summary>
        /// Parses GetMap request nodes
        /// </summary>
        /// <param name="getMapRequestNodes"></param>
        private void ParseGetMapRequest(XmlNode getMapRequestNodes)
        {
            XmlNode xnlHttp = getMapRequestNodes.SelectSingleNode("sm:DCPType/sm:HTTP", _nsmgr);
            if (xnlHttp != null && xnlHttp.HasChildNodes)
            {
                _getMapRequests = new WmsOnlineResource[xnlHttp.ChildNodes.Count];
                for (int i = 0; i < xnlHttp.ChildNodes.Count; i++)
                {
                    var wor = new WmsOnlineResource();
                    wor.Type = xnlHttp.ChildNodes[i].Name;
                    wor.OnlineResource =
                        xnlHttp.ChildNodes[i].SelectSingleNode("sm:OnlineResource", _nsmgr).Attributes["xlink:href"].
                            InnerText;
                    _getMapRequests[i] = wor;
                }
            }
            XmlNodeList xnlFormats = getMapRequestNodes.SelectNodes("sm:Format", _nsmgr);
            //_GetMapOutputFormats = new Collection<string>(xnlFormats.Count);
            _getMapOutputFormats = new Collection<string>();
            for (int i = 0; i < xnlFormats.Count; i++)
                _getMapOutputFormats.Add(xnlFormats[i].InnerText);
        }

        /// <summary>
        /// Iterates through the layer nodes recursively
        /// </summary>
        /// <param name="xmlLayer"></param>
        /// <returns></returns>
        private WmsServerLayer ParseLayer(XmlNode xmlLayer)
        {
            var layer = new WmsServerLayer();
            XmlNode node = xmlLayer.SelectSingleNode("sm:Name", _nsmgr);
            layer.Name = (node != null ? node.InnerText : null);
            node = xmlLayer.SelectSingleNode("sm:Title", _nsmgr);
            layer.Title = (node != null ? node.InnerText : null);
            node = xmlLayer.SelectSingleNode("sm:Abstract", _nsmgr);
            layer.Abstract = (node != null ? node.InnerText : null);
            XmlAttribute attr = xmlLayer.Attributes["queryable"];
            layer.Queryable = (attr != null && attr.InnerText == "1");

            node = xmlLayer.SelectSingleNode("sm:MinScaleDenominator", _nsmgr);
            layer.MinScaleDenominator = (node != null ? node.InnerText : null);
            node = xmlLayer.SelectSingleNode("sm:MaxScaleDenominator", _nsmgr);
            layer.MaxScaleDenominator = (node != null ? node.InnerText : null);
            


            XmlNodeList xnlKeywords = xmlLayer.SelectNodes("sm:KeywordList/sm:Keyword", _nsmgr);
            if (xnlKeywords != null)
            {
                layer.Keywords = new string[xnlKeywords.Count];
                for (int i = 0; i < xnlKeywords.Count; i++)
                    layer.Keywords[i] = xnlKeywords[i].InnerText;
            }
            XmlNodeList xnlCrs = xmlLayer.SelectNodes("sm:CRS", _nsmgr);
            if (xnlCrs != null)
            {
                layer.Crs = new string[xnlCrs.Count];
                for (int i = 0; i < xnlCrs.Count; i++)
                {
                    if (xnlCrs[i].InnerText != null)
                    {
                        layer.Crs[i] = xnlCrs[i].InnerText.Replace("EPSG:", "");
                    }
                }
            }
            XmlNodeList xnlStyle = xmlLayer.SelectNodes("sm:Style", _nsmgr);
            if (xnlStyle != null)
            {
                layer.Style = new WmsLayerStyle[xnlStyle.Count];
                for (int i = 0; i < xnlStyle.Count; i++)
                {
                    node = xnlStyle[i].SelectSingleNode("sm:Name", _nsmgr);
                    layer.Style[i].Name = (node != null ? node.InnerText : null);
                    node = xnlStyle[i].SelectSingleNode("sm:Title", _nsmgr);
                    layer.Style[i].Title = (node != null ? node.InnerText : null);
                    node = xnlStyle[i].SelectSingleNode("sm:Abstract", _nsmgr);
                    layer.Style[i].Abstract = (node != null ? node.InnerText : null);
                    node = xnlStyle[i].SelectSingleNode("sm:LegendURL", _nsmgr);
                    if (node != null)
                    {
                        layer.Style[i].LegendUrl = new WmsStyleLegend();
                        layer.Style[i].LegendUrl.Width = int.Parse(node.Attributes["width"].InnerText);
                        layer.Style[i].LegendUrl.Height = int.Parse(node.Attributes["height"].InnerText);
                        layer.Style[i].LegendUrl.OnlineResource.OnlineResource =
                            node.SelectSingleNode("sm:OnlineResource", _nsmgr).Attributes["xlink:href"].InnerText;
                        layer.Style[i].LegendUrl.OnlineResource.Type =
                            node.SelectSingleNode("sm:Format", _nsmgr).InnerText;
                    }
                    node = xnlStyle[i].SelectSingleNode("sm:StyleSheetURL", _nsmgr);
                    if (node != null)
                    {
                        layer.Style[i].StyleSheetUrl = new WmsOnlineResource();
                        layer.Style[i].StyleSheetUrl.OnlineResource =
                            node.SelectSingleNode("sm:OnlineResource", _nsmgr).Attributes["xlink:href"].InnerText;
                        //layer.Style[i].StyleSheetUrl.OnlineResource = node.SelectSingleNode("sm:Format", nsmgr).InnerText;
                    }
                }
            }
            XmlNodeList xnlLayers = xmlLayer.SelectNodes("sm:Layer", _nsmgr);
            if (xnlLayers != null)
            {
                layer.ChildLayers = new WmsServerLayer[xnlLayers.Count];
                for (int i = 0; i < xnlLayers.Count; i++)
                    layer.ChildLayers[i] = ParseLayer(xnlLayers[i]);
            }
            if (this._wmsVersion == "1.3.0")
            {
                node = xmlLayer.SelectSingleNode("sm:EX_GeographicBoundingBox", _nsmgr);
            }
            else
            {
                node = xmlLayer.SelectSingleNode("sm:LatLonBoundingBox", _nsmgr);
            }
            if (node != null)
            {
                double minx = 0.0, miny = 0.0, maxx = 0.0, maxy = 0.0;
                
                //if (!double.TryParse(node.Attributes["westBoundLongitude"].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out minx) &
                //    !double.TryParse(node.Attributes["southBoundLatitude"].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out miny) &
                //    !double.TryParse(node.Attributes["eastBoundLongitude"].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out maxx) &
                //    !double.TryParse(node.Attributes["northBoundLatitude"].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out maxy))
                //{
                //    throw new ArgumentException("Invalid LatLonBoundingBox on layer '" + layer.Name + "'");
                //}
                if (this._wmsVersion == "1.3.0")
                {
                    double.TryParse(node.SelectSingleNode("sm:westBoundLongitude", _nsmgr).InnerText, NumberStyles.Any, CultureInfo.InvariantCulture, out minx);
                    double.TryParse(node.SelectSingleNode("sm:southBoundLatitude", _nsmgr).InnerText, NumberStyles.Any, CultureInfo.InvariantCulture, out miny);
                    double.TryParse(node.SelectSingleNode("sm:eastBoundLongitude", _nsmgr).InnerText, NumberStyles.Any, CultureInfo.InvariantCulture, out maxx);
                    double.TryParse(node.SelectSingleNode("sm:northBoundLatitude", _nsmgr).InnerText, NumberStyles.Any, CultureInfo.InvariantCulture, out maxy);
                }
                else
                {
                    double.TryParse(node.Attributes["minx"].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out minx);
                    double.TryParse(node.Attributes["miny"].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out miny);
                    double.TryParse(node.Attributes["maxx"].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out maxx);
                    double.TryParse(node.Attributes["maxy"].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out maxy);                    
                }
              
                layer.LatLonBoundingBox = new Extent(minx, miny, maxx, maxy);
            }
            return layer;
        }

        /// <summary>
        /// Parses valid exceptions
        /// </summary>
        /// <param name="xnlExceptionNode"></param>
        private void ParseExceptions(XmlNode xnlExceptionNode)
        {
            XmlNodeList xnlFormats = xnlExceptionNode.SelectNodes("sm:Format", _nsmgr);
            if (xnlFormats != null)
            {
                _exceptionFormats = new string[xnlFormats.Count];
                for (int i = 0; i < xnlFormats.Count; i++)
                {
                    _exceptionFormats[i] = xnlFormats[i].InnerText;
                }
            }
        }

        /// <summary>
        /// Structure for storing information about a WMS Layer Style
        /// </summary>
        public struct WmsLayerStyle
        {
            /// <summary>
            /// Abstract
            /// </summary>
            public string Abstract;

            /// <summary>
            /// Legend
            /// </summary>
            public WmsStyleLegend LegendUrl;

            /// <summary>
            /// Name
            /// </summary>
            public string Name;

            /// <summary>
            /// Style Sheet Url
            /// </summary>
            public WmsOnlineResource StyleSheetUrl;

            /// <summary>
            /// Title
            /// </summary>
            public string Title;
        }


        /// <summary>
        /// Structure for storing info on an Online Resource
        /// </summary>
        public struct WmsOnlineResource
        {
            /// <summary>
            /// URI of online resource
            /// </summary>
            public string OnlineResource;

            /// <summary>
            /// Type of online resource (Ex. request method 'Get' or 'Post')
            /// </summary>
            public string Type;
        }

        /// <summary>
        /// Structure for holding information about a WMS Layer 
        /// </summary>
        public struct WmsServerLayer
        {
            /// <summary>
            /// Abstract
            /// </summary>
            public string Abstract;

            /// <summary>
            /// Collection of child layers
            /// </summary>
            public WmsServerLayer[] ChildLayers;

            /// <summary>
            /// Coordinate Reference Systems supported by layer
            /// </summary>
            public string[] Crs;

            /// <summary>
            /// Keywords
            /// </summary>
            public string[] Keywords;

            /// <summary>
            /// Latitudal/longitudal extent of this layer
            /// </summary>
            public Extent LatLonBoundingBox;

            /// <summary>
            /// Unique name of this layer used for requesting layer
            /// </summary>
            public string Name;

            /// <summary>
            /// Specifies whether this layer is queryable using GetFeatureInfo requests
            /// </summary>
            public bool Queryable;

            /// <summary>
            /// List of styles supported by layer
            /// </summary>
            public WmsLayerStyle[] Style;

            /// <summary>
            /// Layer title
            /// </summary>
            public string Title;

            /// <summary>
            /// Layer minScaleDenominator
            /// </summary>
            public string MinScaleDenominator;

            /// <summary>
            /// Layer maxScaleDenominator
            /// </summary>
            public string MaxScaleDenominator;
        }

        /// <summary>
        /// Structure for storing WMS Legend information
        /// </summary>
        public struct WmsStyleLegend
        {
            /// <summary>
            /// Online resource for legend style 
            /// </summary>
            public WmsOnlineResource OnlineResource;

            /// <summary>
            /// Size of legend
            /// </summary>
            public int Width;
            public int Height;
        }

        public struct Extent
        {
            public double MinX { get; private set; }
            public double MinY { get; private set; }
            public double MaxX { get; private set; }
            public double MaxY { get; private set; }
            public Extent(double minX, double minY, double maxX, double maxY)
                : this()
            {
                MinX = minX;
                MinY = minY;
                MaxX = maxX;
                MaxY = maxY;

                if (minX > maxX || minY > maxY)
                {
                    throw new ArgumentException("min should be smaller than max");
                }
            }
        }




    }
}