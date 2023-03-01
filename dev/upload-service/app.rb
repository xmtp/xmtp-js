require 'rubygems'
require 'puma'
require 'sinatra'

UPLOADS = {}

post '/:path' do
  logger.info  "POST #{params[:path]}"
  UPLOADS[params[:path]] = request.body.read
  "OK"
end

get '/:path' do
  logger.info  "GET #{params[:path]}"
  if data = UPLOADS[params[:path]]
    content_type 'application/octet-stream'
    data
  else
    raise Sinatra::NotFound
  end
end
