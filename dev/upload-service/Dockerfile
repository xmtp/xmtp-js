FROM ruby:3.2

RUN gem install sinatra puma
WORKDIR /usr/src/app
ADD app.rb /usr/src/app/

ENTRYPOINT ["ruby", "app.rb", "-o", "0.0.0.0"]
