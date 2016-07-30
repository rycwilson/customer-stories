xml.instruct! :xml, :version => "1.0"
xml.urlset "xmlns" => "http://www.sitemaps.org/schemas/sitemap/0.9" do

  xml.url do
    xml.loc "https://customerstories.net"
    xml.changefreq "monthly"
    xml.priority "0.9"
  end

  @published_companies.each do |published_co|

    xml.url do
      xml.loc "https://#{published_co[:subdomain]}.customerstories.net"
      xml.lastmod Company.find(published_co[:id])
                         .stories.where(logo_published: true)
                         .order(logo_publish_date: :desc)
                         .take.logo_publish_date.strftime("%F")
      xml.changefreq "weekly"
      xml.priority "0.7"
    end

    published_co[:stories].each do |story|
      xml.url do
        xml.loc story[:url]
        xml.lastmod story[:last_modified].strftime("%F")
        xml.changefreq "monthly"
        xml.priority "0.5"
      end
    end

  end
end