namespace :temp do
  desc "What's up with Embed.ly"
  task emb: :environment do
logger = Logger.new(STDOUT)

    embedly_api =
    Embedly::API.new :user_agent => 'Mozilla/5.0 (compatible; mytestapp/1.0; my@email.com)'
logger.info "embedly_api: #{embedly_api}"
    # single url
    obj = embedly_api.extract :url => 'https://www.linkedin.com/in/wilsonryanc',
                             :key => '9f595b21f8f54828bd803c88800e862e'
logger.info "embedly_api.extract: #{obj}"
#     puts obj[0].marshal_dump
logger.info "marshal_dump: #{obj[0].marshal_dump}"
    json_obj = JSON.pretty_generate(obj[0].marshal_dump)
#     puts json_obj
logger.info "json_obj: #{json_obj}"

    # multiple urls with opts
    # objs = embedly_api.oembed(
    #   :urls => ['http://www.youtube.com/watch?v=sPbJ4Z5D-n4&feature=topvideos',
    #             'http://twitpic.com/3yr7hk'],
    #   :maxwidth => 450,
    #   :wmode => 'transparent',
    #   :method => 'after'
    # )
    # json_obj = JSON.pretty_generate(objs.collect{|o| o.marshal_dump})
    # puts json_obj

    # # call api with key (you'll need a real key)
    # embedly_api = Embedly::API.new :key => '9f595b21f8f54828bd803c88800e862e',
    #         :user_agent => 'Mozilla/5.0 (compatible; mytestapp/1.0; my@email.com)'
    # url = 'http://www.guardian.co.uk/media/2011/jan/21/andy-coulson-phone-hacking-statement'
    # obj = embedly_api.extract :url => url
    # puts JSON.pretty_generate(obj[0].marshal_dump)

  end

end
